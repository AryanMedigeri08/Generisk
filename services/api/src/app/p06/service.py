import hashlib
import hmac
import json
import re
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.p03 import service as identity
from app.p03.models import CaseOwner, Consent, JointReview
from app.p04 import service as reports
from app.p04.models import ImportOutcome, ReportRecord, ReportRevision
from app.p04.schemas import GeneReport, parse_report
from app.p06.provider import EducationalRulesProvider, bindings, result
from app.p06.schemas import Bindings, Result, Unavailable


def current(db: Session, user_id: str) -> tuple[ReportRecord, ReportRevision] | None:
    selected = db.scalar(
        select(ReportRevision)
        .join(ImportOutcome, ImportOutcome.revision_id == ReportRevision.id)
        .where(
            ImportOutcome.actor_id == user_id,
            ImportOutcome.category.in_(("accepted", "review_required")),
        )
        .order_by(ImportOutcome.input_version_after.desc(), ImportOutcome.created_at.desc())
        .limit(1)
    )
    if selected is None:
        return None
    record = db.get(ReportRecord, selected.report_id)
    if record is None or record.owner_id != user_id:
        return None
    return record, selected


def consent_rows(
    ctx: identity.Context, owners: list[CaseOwner], joint: JointReview | None
) -> list[Consent]:
    return list(
        ctx.db.scalars(
            select(Consent).where(
                or_(
                    Consent.case_id.in_([o.case_id for o in owners]),
                    Consent.joint_id == joint.id if joint else Consent.id == "",
                )
            )
        ).all()
    )


def scope_bindings(
    ctx: identity.Context, owners: list[CaseOwner], joint: JointReview | None
) -> Bindings:
    bound = bindings()
    sources = [current(ctx.db, o.user_id) for o in owners]
    own_index = next(i for i, o in enumerate(owners) if o.user_id == ctx.actor.id)
    own = sources[own_index]
    bound.report_id = own[0].id if own else None
    bound.revision = own[1].version if own else None
    bound.input_version = owners[own_index].input_version
    rows = consent_rows(ctx, owners, joint)
    material = {
        "bindings": bound.model_dump(),
        "inputs": [
            (
                o.case_id,
                o.input_version,
                s[1].id if s else None,
                s[0].active_revision_id if s else None,
                s[1].source_sha256 if s else None,
            )
            for o, s in zip(owners, sources, strict=True)
        ],
        "consents": sorted(
            (c.id, c.version, c.state, c.expires_at.isoformat() if c.expires_at else None)
            for c in rows
        ),
        "joint": (joint.id, joint.version, joint.output_version) if joint else None,
    }
    assert ctx.auth_session is not None
    bound.scope_hash = hmac.new(
        ctx.auth_session.token_hash.encode(),
        json.dumps(material, sort_keys=True).encode(),
        hashlib.sha256,
    ).hexdigest()
    return bound


def stale(ctx: identity.Context, bound: Bindings) -> bool:
    pin = ctx.request.headers.get("x-risk-binding")
    return bool(
        pin
        and (
            not re.fullmatch(r"[a-f0-9]{64}", pin)
            or not hmac.compare_digest(pin, bound.scope_hash or "")
        )
    )


def read_source(ctx: identity.Context, user_id: str) -> GeneReport | None:
    pair = current(ctx.db, user_id)
    if pair is None or pair[0].active_revision_id != pair[1].id:
        return None
    report = parse_report(json.dumps(pair[1].content))
    return report if isinstance(report, GeneReport) else None


def unsupported_source(ctx: identity.Context, user_id: str) -> bool:
    selected = current(ctx.db, user_id)
    return bool(selected and selected[1].content.get("schema_version") != "amanah-report-2")


def own_assessment(ctx: identity.Context) -> Result:
    owner = reports.owner(ctx, processing=False)
    bound = scope_bindings(ctx, [owner], None)
    if stale(ctx, bound):
        identity.fail(409, "STALE_BINDING", "risk.stale_binding")
    if not identity.active(
        ctx.db, ctx.actor.id, identity.processing_key(owner)
    ) or not identity.active(
        ctx.db, ctx.actor.id, f"assessment:{owner.case_id}:v{owner.input_version}:educational_risk"
    ):
        identity.fail(403, "ASSESSMENT_REQUIRED", "risk.assessment_required")
    if unsupported_source(ctx, ctx.actor.id):
        out = result("UNSUPPORTED", "risk.unsupported")
    else:
        report = read_source(ctx, ctx.actor.id)
        out = (
            EducationalRulesProvider().own(report)
            if report
            else result("REVIEW_REQUIRED", "risk.review_required")
        )
    out.bindings = bound
    ctx.version = owner.input_version
    return out


def couple_assessment(ctx: identity.Context) -> Result | Unavailable:
    if ctx.actor.role != "individual":
        return Unavailable()
    query = select(JointReview).where(
        or_(JointReview.a_user_id == ctx.actor.id, JointReview.b_user_id == ctx.actor.id)
    )
    selected_joint = ctx.request.headers.get("x-risk-joint")
    if selected_joint:
        try:
            if str(UUID(selected_joint)) != selected_joint:
                return Unavailable()
        except ValueError:
            return Unavailable()
        query = query.where(JointReview.id == selected_joint)
    # Ambiguous contexts need an explicit member-only selection.
    relations = list(ctx.db.scalars(query.limit(2)).all())
    if len(relations) != 1:
        return Unavailable()
    joint = relations[0]
    owners = [identity.owner_for(ctx.db, u) for u in (joint.a_user_id, joint.b_user_id)]
    if [o.input_version for o in owners] != [joint.a_input_version, joint.b_input_version]:
        return Unavailable()
    if not all(
        identity.active(ctx.db, o.user_id, identity.processing_key(o))
        and identity.active(ctx.db, o.user_id, f"assessment:{joint.id}:v{joint.version}")
        and identity.active(
            ctx.db,
            o.user_id,
            f"disclosure:{joint.id}:v{joint.output_version}:participants:educational_risk",
        )
        for o in owners
    ):
        return Unavailable()
    bound = scope_bindings(ctx, owners, joint)
    if stale(ctx, bound):
        return Unavailable()
    if any(unsupported_source(ctx, o.user_id) for o in owners):
        out = result("UNSUPPORTED", "risk.unsupported")
    else:
        a, b = (read_source(ctx, o.user_id) for o in owners)
        out = (
            EducationalRulesProvider().pair(a, b)
            if a and b
            else result("REVIEW_REQUIRED", "risk.review_required")
        )
    out.genes = [g for g in out.genes if g.state == "SHARED_CARRIER"]
    if out.state == "COMPUTED":
        out.state = "SHARED_CARRIER" if out.genes else "NO_SHARED_FINDING"
        out.message_keys = [
            "risk.shared_gene_conditional" if out.genes else "risk.no_shared_finding",
            "risk.each_pregnancy_independent",
        ]
    out.bindings = bound
    ctx.version = joint.version
    return out
