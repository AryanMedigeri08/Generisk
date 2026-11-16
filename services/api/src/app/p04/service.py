import json
from typing import Literal, cast

from sqlalchemy import select

from app.p03 import service as identity
from app.p03.models import CaseOwner
from app.p03.security import digest, now
from app.p04.models import ImportOutcome, ReportRecord, ReportRevision
from app.p04.schemas import (
    AmendIn,
    Category,
    ContentOut,
    FixtureOut,
    HistoryOut,
    ImportIn,
    Receipt,
    ReportOut,
    SelectIn,
    VersionOut,
    parse_report,
)
from app.p04.validation import LibraryUnavailable, ValidationResult, catalog, validate_fixture

Context = identity.Context
LiteralState = Literal["active", "superseded", "review_required"]
LiteralValidation = Literal["accepted", "review_required"]


def owner(ctx: Context, *, processing: bool = True) -> CaseOwner:
    # P03 assignment/processing permits case metadata, NEVER raw report content.
    # No separately authorized professional-report purpose exists in this phase.
    if ctx.actor.role != "individual":
        identity.fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    record = identity.owner_for(ctx.db, ctx.actor.id)
    if processing and not identity.active(ctx.db, ctx.actor.id, identity.processing_key(record)):
        identity.fail(403, "PROCESSING_REQUIRED", "Current own processing permission is required.")
    ctx.version = record.input_version
    return record


def fixtures(ctx: Context, schema_version: str = "amanah-report-1") -> list[FixtureOut]:
    own = owner(ctx, processing=False)
    try:
        entries = catalog()
    except LibraryUnavailable:
        identity.fail(
            503, "FIXTURE_LIBRARY_UNAVAILABLE", "The demonstration source is unavailable."
        )
    return [
        FixtureOut(
            id=e.id,
            label=e.label,
            operation=e.operation,
            expected=e.expected,
            schema_version=e.schema_version,
        )
        for e in entries
        if e.owner_id == ctx.actor.id
        and e.case_id == own.case_id
        and e.schema_version == schema_version
    ]


def get_record(ctx: Context, handle: str) -> ReportRecord:
    report = ctx.db.get(ReportRecord, handle)
    if not report or report.owner_id != ctx.actor.id:
        identity.fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert report is not None
    return report


def revision_rows(ctx: Context, record: ReportRecord) -> list[ReportRevision]:
    return list(
        ctx.db.scalars(
            select(ReportRevision)
            .where(ReportRevision.report_id == record.id)
            .order_by(ReportRevision.version)
        ).all()
    )


def version_view(
    row: ReportRevision, record: ReportRecord, rows: list[ReportRevision]
) -> VersionOut:
    state = "superseded"
    if row.id == record.active_revision_id:
        state = "active"
    elif not any(other.supersedes_id == row.id for other in rows):
        if row.validation_state == "review_required":
            state = "review_required"
    return VersionOut(
        revision_handle=row.id,
        source_revision_id=row.source_revision_id,
        version=row.version,
        state=cast(LiteralState, state),
        validation_state=cast(LiteralValidation, row.validation_state),
        supersedes_revision_handle=row.supersedes_id,
        amendment_reason=row.amendment_reason,
        imported_at=row.imported_at,
        validated_at=row.validated_at,
        source_sha256=row.source_sha256,
        fixture_id=row.fixture_id,
        imported_by=row.imported_by,
    )


def report_view(ctx: Context, record: ReportRecord) -> ReportOut:
    rows = revision_rows(ctx, record)
    return ReportOut(
        report_handle=record.id,
        source_report_id=record.source_report_id,
        active_revision_handle=record.active_revision_id,
        versions=[version_view(row, record, rows) for row in rows],
        selected_gene_scenario=(
            selected_gene_revision(ctx) in {row.id for row in rows}
            if rows and rows[-1].content.get("schema_version") == "amanah-report-2"
            else None
        ),
    )


def reports(ctx: Context) -> list[ReportOut]:
    own = owner(ctx)
    return [
        report_view(ctx, row)
        for row in ctx.db.scalars(
            select(ReportRecord)
            .where(ReportRecord.owner_id == ctx.actor.id, ReportRecord.case_id == own.case_id)
            .order_by(ReportRecord.source_report_id)
            .limit(20)
        ).all()
    ]


def versions(ctx: Context, body: SelectIn) -> ReportOut:
    owner(ctx)
    return report_view(ctx, get_record(ctx, body.report_handle))


def content(ctx: Context, body: SelectIn) -> ContentOut:
    owner(ctx)
    record = get_record(ctx, body.report_handle)
    rows = revision_rows(ctx, record)
    selected = body.revision_handle or record.active_revision_id
    row = next((item for item in rows if item.id == selected), None)
    if row is None:
        identity.fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert row is not None
    return ContentOut(
        report_handle=record.id,
        revision=version_view(row, record, rows),
        content=parse_report(json.dumps(row.content)),
    )


def receipt(row: ImportOutcome, current: int, *, replayed: bool = False) -> Receipt:
    return Receipt(
        outcome_handle=row.id,
        category=cast(Category, row.category),
        reason_codes=row.reason_codes,
        report_handle=row.report_id,
        revision_handle=row.revision_id,
        input_version_after=row.input_version_after,
        current_input_version=current,
        replayed=replayed,
    )


def history(ctx: Context) -> list[HistoryOut]:
    own = owner(ctx)
    return [
        HistoryOut(
            **receipt(row, own.input_version).model_dump(),
            operation=cast(Literal["import", "amend", "scenario"], row.operation),
            fixture_id=row.fixture_id,
            created_at=row.created_at,
        )
        for row in ctx.db.scalars(
            select(ImportOutcome)
            .where(ImportOutcome.actor_id == ctx.actor.id)
            .order_by(ImportOutcome.created_at.desc())
            .limit(30)
        ).all()
    ]


def selected_gene_revision(ctx: Context) -> str | None:
    return ctx.db.scalar(
        select(ImportOutcome.revision_id)
        .join(ReportRevision, ImportOutcome.revision_id == ReportRevision.id)
        .where(
            ImportOutcome.actor_id == ctx.actor.id,
            ImportOutcome.category.in_(("accepted", "review_required")),
            ReportRevision.content["schema_version"].as_string() == "amanah-report-2",
        )
        .order_by(ImportOutcome.input_version_after.desc(), ImportOutcome.created_at.desc())
        .limit(1)
    )


def activate_gene_scenario(ctx: Context, target: ReportRecord, revision: ReportRevision) -> None:
    # Only validated, owned, latest predefined revisions reach this operation.
    for record in ctx.db.scalars(
        select(ReportRecord).where(ReportRecord.owner_id == ctx.actor.id)
    ).all():
        if record.id == target.id or record.active_revision_id is None:
            continue
        active_revision = ctx.db.get(ReportRevision, record.active_revision_id)
        if active_revision and active_revision.content.get("schema_version") == "amanah-report-2":
            record.active_revision_id = None
    target.active_revision_id = revision.id if revision.validation_state == "accepted" else None
    ctx.db.flush()


def import_report(
    ctx: Context, body: ImportIn, *, amendment: bool = False, scenario: bool = False
) -> Receipt:
    own = owner(ctx)
    ctx.rate("report-operation:" + ctx.actor.id, 20)
    operation = "scenario" if scenario else "amend" if amendment else "import"
    fingerprint = digest(json.dumps({"operation": operation, **body.model_dump()}, sort_keys=True))
    prior = ctx.db.scalar(
        select(ImportOutcome).where(
            ImportOutcome.actor_id == ctx.actor.id,
            ImportOutcome.idempotency_key == body.idempotency_key,
        )
    )
    if prior:
        if prior.fingerprint != fingerprint:
            identity.fail(409, "VERSION_CONFLICT", "Refresh the current scope and version.")
        return receipt(prior, own.input_version, replayed=True)
    if body.expected_input_version != own.input_version:
        identity.fail(409, "VERSION_CONFLICT", "Refresh the current scope and version.")
    try:
        entry = next(
            (
                e
                for e in catalog()
                if e.id == body.fixture_id
                and e.owner_id == ctx.actor.id
                and e.case_id == own.case_id
            ),
            None,
        )
    except LibraryUnavailable:
        identity.fail(
            503, "FIXTURE_LIBRARY_UNAVAILABLE", "The demonstration source is unavailable."
        )
    if entry is None:
        identity.fail(404, "RESOURCE_UNAVAILABLE", "Resource unavailable.")
    assert entry is not None
    if not scenario and entry.operation != operation:
        identity.fail(409, "FIXTURE_OPERATION_UNAVAILABLE", "Select the matching fixture action.")
    if scenario and entry.schema_version != "amanah-report-2":
        identity.fail(409, "FIXTURE_OPERATION_UNAVAILABLE", "Select a gene-level demo scenario.")
    target: ReportRecord | None = None
    predecessor: ReportRevision | None = None
    if amendment:
        assert isinstance(body, AmendIn)
        target = get_record(ctx, body.report_handle)
        rows = revision_rows(ctx, target)
        predecessor = rows[-1] if rows else None
        if predecessor is None or predecessor.version != body.expected_revision:
            identity.fail(409, "VERSION_CONFLICT", "Refresh the current scope and version.")
    result = validate_fixture(entry)
    report = result.report
    if report is not None:
        if amendment:
            assert predecessor is not None and target is not None
            if (
                report.report_id != target.source_report_id
                or report.supersedes_revision_id != predecessor.source_revision_id
                or report.revision != predecessor.version + 1
                or report.status != "amended"
            ):
                result = ValidationResult(
                    "malformed", ["revision_relationship_invalid"], result.source_hash
                )
        else:
            target = ctx.db.scalar(
                select(ReportRecord).where(
                    ReportRecord.owner_id == ctx.actor.id,
                    ReportRecord.source_report_id == report.report_id,
                )
            )
            if target:
                original = next(
                    (row for row in revision_rows(ctx, target) if row.version == report.revision),
                    None,
                )
                if original and original.source_sha256 == result.source_hash:
                    if scenario:
                        latest = revision_rows(ctx, target)[-1]
                        if original.id != latest.id:
                            identity.fail(
                                409, "VERSION_CONFLICT", "Select the latest source revision."
                            )
                        if selected_gene_revision(ctx) != original.id:
                            activate_gene_scenario(ctx, target, original)
                            identity.supersede_case(ctx, own.case_id, own.input_version)
                            selection = ValidationResult(
                                cast(Category, original.validation_state),
                                ["predefined_scenario_selected"],
                                result.source_hash,
                            )
                            return save_outcome(
                                ctx, own, body, operation, fingerprint, selection, target, original
                            )
                    result = ValidationResult(
                        "duplicate", ["source_already_imported"], result.source_hash
                    )
                    return save_outcome(
                        ctx, own, body, operation, fingerprint, result, target, original
                    )
                result = ValidationResult("malformed", ["revision_conflict"], result.source_hash)
            elif report.revision != 1 or report.status == "amended":
                result = ValidationResult(
                    "malformed", ["revision_relationship_invalid"], result.source_hash
                )
    revision: ReportRevision | None = None
    if result.report is not None:
        report = result.report
        assert result.source_payload is not None and result.source_hash is not None
        if target is None:
            target = ReportRecord(
                id=identity.uid(),
                case_id=own.case_id,
                owner_id=ctx.actor.id,
                source_report_id=report.report_id,
                active_revision_id=None,
            )
            ctx.db.add(target)
            ctx.db.flush()
        revision = ReportRevision(
            id=identity.uid(),
            report_id=target.id,
            source_revision_id=report.revision_id,
            version=report.revision,
            validation_state=result.category,
            supersedes_id=predecessor.id if predecessor else None,
            amendment_reason=report.amendment_reason,
            content=report.model_dump(mode="json"),
            source_payload=result.source_payload,
            source_sha256=result.source_hash,
            fixture_id=entry.id,
            imported_by=ctx.actor.id,
            imported_at=now(),
            validated_at=now(),
        )
        ctx.db.add(revision)
        ctx.db.flush()
        target.active_revision_id = revision.id if result.category == "accepted" else None
        ctx.db.flush()
        if report.schema_version == "amanah-report-2":
            activate_gene_scenario(ctx, target, revision)
        # Existing P03 mechanism invalidates current processing/joint/output versions atomically.
        identity.supersede_case(ctx, own.case_id, own.input_version)
    return save_outcome(ctx, own, body, operation, fingerprint, result, target, revision)


def save_outcome(
    ctx: Context,
    own: CaseOwner,
    body: ImportIn,
    operation: str,
    fingerprint: str,
    result: ValidationResult,
    target: ReportRecord | None,
    revision: ReportRevision | None,
) -> Receipt:
    row = ImportOutcome(
        id=identity.uid(),
        actor_id=ctx.actor.id,
        case_id=own.case_id,
        operation=operation,
        idempotency_key=body.idempotency_key,
        fingerprint=fingerprint,
        fixture_id=body.fixture_id,
        source_sha256=result.source_hash,
        category=result.category,
        reason_codes=result.reasons,
        report_id=target.id if target else None,
        revision_id=revision.id if revision else None,
        input_version_after=own.input_version,
        created_at=now(),
    )
    ctx.db.add(row)
    ctx.db.flush()
    identity.audit(
        ctx.db,
        ctx.actor.id,
        "report_validation",
        "synthetic_report",
        result.category,
        version=own.input_version,
    )
    ctx.version = own.input_version
    return receipt(row, own.input_version)
