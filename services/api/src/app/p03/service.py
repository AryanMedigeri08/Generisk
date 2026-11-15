from __future__ import annotations

import hmac
import json
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import TypeVar, cast
from urllib.parse import urlsplit
from uuid import uuid4

from fastapi import Request
from sqlalchemy import or_, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import DemoCase
from app.errors import DemoError
from app.modules.identity import Principal
from app.p03.consent import DatabaseConsentProvider
from app.p03.identity import LocalSessionIdentity
from app.p03.models import (
    AuditEvent,
    CaseAssignment,
    CaseOwner,
    Consent,
    ConsentEvent,
    DemoSession,
    DemoUser,
    Idempotency,
    Invitation,
    JointReview,
    RateBucket,
)
from app.p03.schemas import (
    AuditOut,
    CaseOut,
    ConsentIn,
    ConsentOut,
    InviteIn,
    InviteOut,
    JointOut,
    LoginIn,
    PlaceholderOut,
    Role,
    Scope,
    SessionOut,
    WithdrawIn,
)
from app.p03.security import (
    COOKIE_NAME,
    csrf_for,
    digest,
    dummy_hash,
    new_token,
    now,
    verify_password,
)

T = TypeVar("T")
GATE_KEY = 7300301


def uid() -> str:
    return str(uuid4())


def fail(status: int, code: str, message: str) -> None:
    raise DemoError(status, code, message)


def audit(
    db: Session,
    actor: str | None,
    action: str,
    purpose: str,
    decision: str,
    resource: str | None = None,
    version: int | None = None,
) -> None:
    db.add(
        AuditEvent(
            id=uid(),
            actor_id=actor,
            action=action,
            purpose=purpose,
            decision=decision,
            resource_id=resource,
            version=version,
            created_at=now(),
        )
    )
    db.flush()  # Required persistence failure rolls back the entire enclosing action.


@dataclass
class Context:
    db: Session
    config: Settings
    request: Request
    user: DemoUser | None = None
    auth_session: DemoSession | None = None
    version: int | None = None

    @property
    def actor(self) -> DemoUser:
        if self.user is None:
            raise DemoError(
                401, "AUTHENTICATION_REQUIRED", "Sign in to the fictional demonstration."
            )
        return self.user

    def authenticate(self) -> None:
        identity = LocalSessionIdentity().resolve(
            self.db, self.request.cookies.get(COOKIE_NAME), now()
        )
        if identity is None:
            fail(401, "AUTHENTICATION_REQUIRED", "Sign in to the fictional demonstration.")
        assert identity is not None
        self.user, self.auth_session = identity.user, identity.session

    def origin(self) -> None:
        supplied = urlsplit(self.request.headers.get("origin", ""))
        configured = urlsplit(self.config.web_origin)
        if (
            supplied.scheme != configured.scheme
            or supplied.port != configured.port
            or supplied.hostname not in {"localhost", "127.0.0.1"}
            or supplied.path
            or supplied.query
            or supplied.fragment
            or supplied.username
            or self.request.headers.get("sec-fetch-site") == "cross-site"
            or self.request.headers.get("x-demo-request") != "1"
        ):
            fail(403, "CSRF_REJECTED", "The demonstration request could not be verified.")

    def csrf(self, session: DemoSession | None = None) -> None:
        self.origin()
        record = session or self.auth_session
        supplied = self.request.headers.get("x-csrf-token", "")
        if (
            record is None
            or not supplied
            or not hmac.compare_digest(record.csrf_hash, digest(supplied))
        ):
            fail(403, "CSRF_REJECTED", "The demonstration request could not be verified.")

    def rate(self, key: str, limit: int) -> None:
        stamp = now()
        hashed = digest(key)
        bucket = self.db.get(RateBucket, hashed)
        if bucket is None:
            self.db.add(RateBucket(key=hashed, window_start=stamp, count=1))
        elif bucket.window_start + timedelta(seconds=self.config.rate_window_seconds) <= stamp:
            bucket.window_start, bucket.count = stamp, 1
        elif bucket.count >= limit:
            fail(429, "RATE_LIMITED", "Too many demonstration attempts. Try again later.")
        else:
            bucket.count += 1
        self.db.flush()


def run(
    engine: Engine,
    config: Settings,
    request: Request,
    action: str,
    purpose: str,
    operation: Callable[[Context], T],
    *,
    authenticated: bool = True,
    mutation: bool = False,
    resource: str | None = None,
) -> T:
    error: DemoError | None = None
    result: T | None = None
    try:
        with Session(engine, expire_on_commit=False) as db, db.begin():
            if engine.dialect.name == "postgresql":
                # One demo-wide transaction gate: reads, revocation and audit share a total order.
                db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": GATE_KEY})
            ctx = Context(db, config, request)
            try:
                if engine.dialect.name != "postgresql" and (
                    request.cookies.get(COOKIE_NAME) or not authenticated
                ):
                    fail(
                        503,
                        "POSTGRESQL_REQUIRED",
                        "Identity and consent require the demo database.",
                    )
                if authenticated:
                    ctx.authenticate()
                if mutation:
                    ctx.csrf()
                if ctx.user is not None:
                    expire_permissions(db)
                result = operation(ctx)
            except DemoError as exc:
                # Operations validate before their primary mutations. Intended expiry/rate changes
                # and denial evidence commit here; persistence errors still roll back everything.
                error = exc
            audit(
                db,
                ctx.user.id if ctx.user else None,
                action,
                purpose,
                "denied" if error else "allowed",
                resource,
                ctx.version,
            )
    except SQLAlchemyError as exc:
        raise DemoError(
            503, "SENSITIVE_ACTION_UNAVAILABLE", "The demonstration action is unavailable."
        ) from exc
    if error:
        raise error
    return cast(T, result)


def make_session(ctx: Context, user_id: str | None, seconds: int) -> tuple[str, DemoSession]:
    raw = new_token()
    record = DemoSession(
        token_hash=digest(raw),
        user_id=user_id,
        csrf_hash=digest(csrf_for(raw)),
        created_at=now(),
        expires_at=now() + timedelta(seconds=seconds),
        revoked_at=None,
    )
    ctx.db.add(record)
    ctx.db.flush()
    return raw, record


def challenge(ctx: Context) -> tuple[str, DemoSession]:
    ctx.origin()
    ctx.rate("challenge:" + (ctx.request.client.host if ctx.request.client else "local"), 30)
    raw = ctx.request.cookies.get(COOKIE_NAME, "")
    previous = ctx.db.get(DemoSession, digest(raw)) if raw and len(raw) <= 128 else None
    if previous and not previous.revoked_at:
        previous.revoked_at = now()
    return make_session(ctx, None, 300)


def session_view(user: DemoUser, record: DemoSession, raw: str) -> SessionOut:
    return SessionOut(
        user_id=user.id,
        username=user.username,
        display_name=user.display_name,
        role=cast(Role, user.role),
        csrf_token=csrf_for(raw),
        expires_at=record.expires_at,
    )


def current_session(ctx: Context) -> SessionOut:
    ctx.origin()
    assert ctx.auth_session is not None
    return session_view(ctx.actor, ctx.auth_session, ctx.request.cookies.get(COOKIE_NAME, ""))


def login(ctx: Context, body: LoginIn) -> tuple[str, SessionOut]:
    raw = ctx.request.cookies.get(COOKIE_NAME, "")
    pre = ctx.db.get(DemoSession, digest(raw)) if raw and len(raw) <= 128 else None
    if pre is None or pre.user_id is not None or pre.revoked_at or pre.expires_at <= now():
        fail(403, "CSRF_REJECTED", "Begin a new demonstration sign-in.")
    assert pre is not None
    ctx.csrf(pre)
    ctx.rate("login-user:" + body.username, ctx.config.login_limit)
    ctx.rate("login-ip:" + (ctx.request.client.host if ctx.request.client else "local"), 30)
    user = ctx.db.scalar(select(DemoUser).where(DemoUser.username == body.username))
    valid = verify_password(user.password_hash if user else dummy_hash(), body.password)
    if user is None or not valid:
        fail(401, "INVALID_CREDENTIALS", "The demonstration credentials were not accepted.")
    assert user is not None
    pre.revoked_at = now()
    new_raw, record = make_session(ctx, user.id, ctx.config.session_ttl_seconds)
    ctx.user = user
    return new_raw, session_view(user, record, new_raw)


def logout(ctx: Context) -> dict[str, bool]:
    assert ctx.auth_session is not None
    ctx.auth_session.revoked_at = now()
    return {"signed_out": True}


def owner_for(db: Session, user_id: str) -> CaseOwner:
    owner = db.scalar(select(CaseOwner).where(CaseOwner.user_id == user_id))
    if owner is None:
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert owner is not None
    return owner


def processing_key(owner: CaseOwner) -> str:
    return f"processing:{owner.case_id}:v{owner.input_version}"


def active(db: Session, user_id: str, key: str) -> bool:
    return DatabaseConsentProvider(db).allows(Principal(user_id), key, key.split(":", 1)[0])


def case_metadata(ctx: Context, case_id: str) -> CaseOut:
    owner = ctx.db.get(CaseOwner, case_id)
    allowed = owner is not None and owner.user_id == ctx.actor.id and ctx.actor.role == "individual"
    if owner and ctx.actor.role == "counsellor":
        assigned = ctx.db.get(CaseAssignment, {"case_id": case_id, "user_id": ctx.actor.id})
        allowed = bool(
            assigned
            and assigned.purpose == "case_metadata"
            and active(ctx.db, owner.user_id, processing_key(owner))
        )
    if not allowed:
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    record = ctx.db.get(DemoCase, case_id)
    assert record is not None and owner is not None
    ctx.version = owner.input_version
    return CaseOut(
        id=record.id,
        display_name=record.display_name,
        scenario=record.scenario,
        input_version=owner.input_version,
    )


def own_cases(ctx: Context) -> list[CaseOut]:
    if ctx.actor.role != "individual":
        return []
    owner = owner_for(ctx.db, ctx.actor.id)
    return [case_metadata(ctx, owner.case_id)]


def professional_cases(ctx: Context) -> list[CaseOut]:
    if ctx.actor.role != "counsellor":
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assignments = ctx.db.scalars(
        select(CaseAssignment).where(CaseAssignment.user_id == ctx.actor.id)
    ).all()
    result = []
    for assignment in assignments:
        owner = ctx.db.get(CaseOwner, assignment.case_id)
        if owner and active(ctx.db, owner.user_id, processing_key(owner)):
            result.append(case_metadata(ctx, owner.case_id))
    return result


def create_invitation(ctx: Context, body: InviteIn) -> InviteOut:
    if ctx.actor.role != "individual":
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    ctx.rate("invitation:" + ctx.actor.id, ctx.config.invitation_limit)
    recipient = ctx.db.scalar(select(DemoUser).where(DemoUser.username == body.recipient_username))
    if not recipient or recipient.id == ctx.actor.id or recipient.role != "individual":
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert recipient is not None
    owner_for(ctx.db, ctx.actor.id)
    owner_for(ctx.db, recipient.id)
    raw = new_token()
    invitation = Invitation(
        id=uid(),
        token_hash=digest(raw),
        sender_id=ctx.actor.id,
        recipient_id=recipient.id,
        state="pending",
        expires_at=now() + timedelta(seconds=ctx.config.invitation_ttl_seconds),
    )
    ctx.db.add(invitation)
    return InviteOut(
        id=invitation.id, status="unavailable", delivery_token=raw, expires_at=invitation.expires_at
    )


def invite_view(ctx: Context, invitation: Invitation) -> InviteOut:
    if invitation.expires_at <= now() and invitation.state == "pending":
        invitation.state = "expired"
    if invitation.recipient_id == ctx.actor.id:
        return InviteOut(
            id=invitation.id,
            status=invitation.state,
            joint_id=invitation.joint_id,
            expires_at=invitation.expires_at,
        )
    return InviteOut(
        id=invitation.id,
        status="available" if invitation.state == "accepted" else "unavailable",
        joint_id=invitation.joint_id if invitation.state == "accepted" else None,
    )


def inspect_invitation(ctx: Context, invitation_id: str) -> InviteOut:
    invitation = ctx.db.get(Invitation, invitation_id)
    if not invitation or ctx.actor.id not in (invitation.sender_id, invitation.recipient_id):
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert invitation is not None
    return invite_view(ctx, invitation)


def invitations(ctx: Context) -> list[InviteOut]:
    records = ctx.db.scalars(
        select(Invitation).where(
            or_(Invitation.sender_id == ctx.actor.id, Invitation.recipient_id == ctx.actor.id)
        )
    ).all()
    return [invite_view(ctx, record) for record in records]


def decide_invitation(ctx: Context, invitation_id: str, raw: str, decision: str) -> InviteOut:
    invitation = ctx.db.get(Invitation, invitation_id)
    if (
        not invitation
        or invitation.recipient_id != ctx.actor.id
        or invitation.state != "pending"
        or invitation.expires_at <= now()
        or not hmac.compare_digest(invitation.token_hash, digest(raw))
    ):
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert invitation is not None
    if decision == "accept":
        a, b = owner_for(ctx.db, invitation.sender_id), owner_for(ctx.db, invitation.recipient_id)
        joint = JointReview(
            id=uid(),
            a_user_id=a.user_id,
            b_user_id=b.user_id,
            a_case_id=a.case_id,
            b_case_id=b.case_id,
            a_input_version=a.input_version,
            b_input_version=b.input_version,
            version=1,
            output_version=1,
            placeholder_reviewed=False,
        )
        ctx.db.add(joint)
        ctx.db.flush()
        invitation.joint_id = joint.id
        invitation.state = "accepted"
    else:
        invitation.state = "declined"
    return invite_view(ctx, invitation)


def member_joint(ctx: Context, joint_id: str) -> JointReview:
    joint = ctx.db.get(JointReview, joint_id)
    if not joint or ctx.actor.id not in (joint.a_user_id, joint.b_user_id):
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert joint is not None
    return joint


def consent_view(consent: Consent, replayed: bool = False) -> ConsentOut:
    return ConsentOut(
        id=consent.id,
        scope=consent.scope,
        scope_key=consent.scope_key,
        state=consent.state,
        version=consent.version,
        target_version=consent.target_version,
        case_id=consent.case_id,
        joint_id=consent.joint_id,
        expires_at=consent.expires_at,
        replayed=replayed,
    )


def transition(
    db: Session,
    consent: Consent,
    state: str,
    expiry: datetime | None = None,
    *,
    actor_id: str | None = None,
) -> None:
    consent.state, consent.expires_at = state, expiry
    consent.version += 1
    db.flush()
    db.add(
        ConsentEvent(
            id=uid(), consent_id=consent.id, version=consent.version, state=state, created_at=now()
        )
    )
    audit(db, actor_id, "consent_" + state, consent.scope, state, consent.id, consent.version)


def expire_permissions(db: Session) -> None:
    for consent in db.scalars(
        select(Consent).where(Consent.state == "granted", Consent.expires_at <= now())
    ).all():
        transition(db, consent, "expired")


def decide_consent(ctx: Context, body: ConsentIn) -> ConsentOut:
    if ctx.actor.role != "individual":
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    fingerprint = digest(json.dumps(body.model_dump(exclude={"idempotency_key"}), sort_keys=True))
    old = ctx.db.get(Idempotency, {"user_id": ctx.actor.id, "key": body.idempotency_key})
    if old:
        if old.fingerprint != fingerprint:
            fail(409, "VERSION_CONFLICT", "Refresh the current scope and version.")
        consent = ctx.db.get(Consent, old.consent_id)
        assert consent is not None
        return consent_view(consent, True)
    if body.scope == "processing":
        owner = owner_for(ctx.db, ctx.actor.id)
        if body.case_id != owner.case_id or body.joint_id is not None:
            fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
        target, key = owner.input_version, processing_key(owner)
    else:
        joint = member_joint(ctx, body.joint_id or "")
        if body.case_id is not None:
            fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
        target = joint.version if body.scope == "assessment" else joint.output_version
        key = f"{body.scope}:{joint.id}:v{target}"
        if body.scope == "disclosure":
            key += ":participants"
            if not joint.placeholder_reviewed:
                fail(409, "OUTPUT_UNAVAILABLE", "No reviewed placeholder output is available.")
    if body.target_version != target:
        fail(409, "VERSION_CONFLICT", "Refresh the current scope and version.")
    consent = ctx.db.scalar(
        select(Consent).where(Consent.user_id == ctx.actor.id, Consent.scope_key == key)
    )
    if body.expected_version != (consent.version if consent else 0):
        fail(409, "VERSION_CONFLICT", "Refresh the current scope and version.")
    state = {"grant": "granted", "refuse": "refused", "withdraw": "withdrawn"}[body.decision]
    if consent is None:
        consent = Consent(
            id=uid(),
            user_id=ctx.actor.id,
            scope=body.scope,
            scope_key=key,
            case_id=body.case_id,
            joint_id=body.joint_id,
            target_version=target,
            state=state,
            version=0,
            expires_at=None,
        )
        ctx.db.add(consent)
    if consent.version == 0 or consent.state != state:
        transition(
            ctx.db,
            consent,
            state,
            now() + timedelta(seconds=ctx.config.consent_ttl_seconds)
            if state == "granted"
            else None,
            actor_id=ctx.actor.id,
        )
    ctx.db.add(
        Idempotency(
            user_id=ctx.actor.id,
            key=body.idempotency_key,
            fingerprint=fingerprint,
            consent_id=consent.id,
        )
    )
    ctx.version = consent.version
    return consent_view(consent)


def own_consents(ctx: Context) -> list[ConsentOut]:
    return [
        consent_view(row)
        for row in ctx.db.scalars(select(Consent).where(Consent.user_id == ctx.actor.id)).all()
    ]


def withdraw_consent(ctx: Context, consent_id: str, body: WithdrawIn) -> ConsentOut:
    consent = ctx.db.get(Consent, consent_id)
    if not consent or consent.user_id != ctx.actor.id:
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert consent is not None
    return decide_consent(
        ctx,
        ConsentIn(
            scope=cast(Scope, consent.scope),
            case_id=consent.case_id,
            joint_id=consent.joint_id,
            target_version=consent.target_version,
            decision="withdraw",
            expected_version=body.expected_version,
            idempotency_key=body.idempotency_key,
        ),
    )


def joint_view(ctx: Context, joint: JointReview) -> JointOut:
    owners = [owner_for(ctx.db, user_id) for user_id in (joint.a_user_id, joint.b_user_id)]
    current = [owner.input_version for owner in owners] == [
        joint.a_input_version,
        joint.b_input_version,
    ]
    available = current and all(
        active(ctx.db, owner.user_id, processing_key(owner))
        and active(ctx.db, owner.user_id, f"assessment:{joint.id}:v{joint.version}")
        for owner in owners
    )
    disclosure = (
        available
        and joint.placeholder_reviewed
        and all(
            active(
                ctx.db, owner.user_id, f"disclosure:{joint.id}:v{joint.output_version}:participants"
            )
            for owner in owners
        )
    )
    ctx.version = joint.version
    return JointOut(
        id=joint.id,
        version=joint.version,
        output_version=joint.output_version,
        status="available_for_demo_review" if available else "unavailable",
        can_disclose=disclosure,
        placeholder_reviewed=joint.placeholder_reviewed,
    )


def joints(ctx: Context) -> list[JointOut]:
    return [
        joint_view(ctx, joint)
        for joint in ctx.db.scalars(
            select(JointReview).where(
                or_(JointReview.a_user_id == ctx.actor.id, JointReview.b_user_id == ctx.actor.id)
            )
        ).all()
    ]


def placeholder(ctx: Context, joint_id: str) -> PlaceholderOut:
    joint = member_joint(ctx, joint_id)
    if not joint_view(ctx, joint).can_disclose:
        fail(403, "JOINT_UNAVAILABLE", "The joint demonstration is unavailable.")
    return PlaceholderOut(output_version=joint.output_version)


def supersede_case(ctx: Context, case_id: str, expected: int) -> CaseOut:
    owner = owner_for(ctx.db, ctx.actor.id)
    if case_id != owner.case_id:
        fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    if owner.input_version != expected:
        fail(409, "VERSION_CONFLICT", "Refresh the current scope and version.")
    affected = ctx.db.scalars(
        select(JointReview).where(
            or_(JointReview.a_case_id == case_id, JointReview.b_case_id == case_id)
        )
    ).all()
    owner.input_version += 1
    affected_ids = [joint.id for joint in affected]
    for joint in affected:
        if joint.a_case_id == case_id:
            joint.a_input_version = owner.input_version
        else:
            joint.b_input_version = owner.input_version
        joint.version += 1
        joint.output_version += 1
        joint.placeholder_reviewed = False
    for consent in ctx.db.scalars(
        select(Consent).where(or_(Consent.case_id == case_id, Consent.joint_id.in_(affected_ids)))
    ).all():
        if consent.state != "superseded":
            transition(ctx.db, consent, "superseded")
    return case_metadata(ctx, case_id)


def own_audit(ctx: Context) -> list[AuditOut]:
    rows = ctx.db.scalars(
        select(AuditEvent)
        .where(AuditEvent.actor_id == ctx.actor.id)
        .order_by(AuditEvent.created_at.desc())
        .limit(30)
    ).all()
    return [
        AuditOut(
            id=row.id,
            action=row.action,
            purpose=row.purpose,
            resource_id=row.resource_id,
            decision=row.decision,
            version=row.version,
            created_at=row.created_at,
        )
        for row in rows
    ]
