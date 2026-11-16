import hashlib
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import func, select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session
from test_p03_postgres import DemoHarness, wait_for_lock_waiters
from test_p03_postgres import demo as demo

from app.p03.models import AuditEvent, CaseOwner, Consent, ConsentEvent, DemoSession, JointReview
from app.p03.security import COOKIE_NAME, digest, now
from app.p03.service import GATE_KEY
from app.p04.models import ImportOutcome, ReportRecord, ReportRevision
from app.p04.validation import LIBRARY_ROOT

pytestmark = pytest.mark.integration


def grant(demo: DemoHarness, client: TestClient) -> dict:
    case = client.get("/api/v1/me/cases").json()[0]
    choices = client.get("/api/v1/me/consents").json()
    own = next(
        (
            c
            for c in choices
            if c["scope"] == "processing" and c["target_version"] == case["input_version"]
        ),
        None,
    )
    result = demo.decide(
        client,
        "processing",
        case=case["id"],
        target=case["input_version"],
        version=own["version"] if own else 0,
    )
    assert result.status_code == 200
    return result.json()


def ingest(client: TestClient, fixture: str = "fixture-a-complete", **extra):
    case = client.get("/api/v1/me/cases").json()[0]
    payload = {
        "fixture_id": fixture,
        "expected_input_version": case["input_version"],
        "idempotency_key": str(uuid4()),
        **extra,
    }
    return client.post("/api/v1/reports/import", json=payload)


def amendment(client: TestClient, handle: str, **extra):
    return client.post(
        "/api/v1/reports/amend",
        json={
            "fixture_id": "fixture-a-amend",
            "report_handle": handle,
            "expected_revision": 1,
            "expected_input_version": client.get("/api/v1/me/cases").json()[0]["input_version"],
            "idempotency_key": str(uuid4()),
            **extra,
        },
    )


def view(client: TestClient, handle: str, revision: str | None = None):
    return client.post(
        "/api/v1/reports/view", json={"report_handle": handle, "revision_handle": revision}
    )


def prepared(demo: DemoHarness) -> tuple[TestClient, dict]:
    a = demo.login("demo-a")
    grant(demo, a)
    imported = ingest(a)
    assert imported.status_code == 200 and imported.json()["category"] == "accepted"
    grant(demo, a)
    return a, imported.json()


def test_import_provenance_and_fresh_processing_after_changed_input(demo: DemoHarness):
    a = demo.login("demo-a")
    assert a.get("/api/v1/reports").status_code == 403
    assert len(a.get("/api/v1/reports/fixtures").json()) == 12
    grant(demo, a)
    result = ingest(a).json()
    assert result["category"] == "accepted" and result["input_version_after"] == 2
    assert a.get("/api/v1/reports").status_code == 403  # No silently inherited processing grant.
    grant(demo, a)
    listing = a.get("/api/v1/reports").json()
    content = view(a, result["report_handle"]).json()
    assert content["content"]["coverage"]["excluded"] == ["syn-marker-kite"]
    assert content["revision"]["state"] == "active"
    assert content["revision"]["source_sha256"] == listing[0]["versions"][0]["source_sha256"]
    assert content["revision"]["imported_by"] == "demo-user-a"
    assert content["revision"]["validated_at"] and content["revision"]["imported_at"]
    assert "Not clinically interpretable" in content["disclaimer"]
    assert (
        a.post(
            "/api/v1/reports/provenance", json={"report_handle": result["report_handle"]}
        ).status_code
        == 200
    )
    assert a.get("/api/v1/reports/history").json()[0]["operation"] == "import"
    with Session(demo.engine) as db:
        revision = db.get(ReportRevision, result["revision_handle"])
        assert (
            hashlib.sha256(revision.source_payload.encode()).hexdigest() == revision.source_sha256
        )


@pytest.mark.parametrize(
    ("fixture", "category", "stored"),
    [
        ("fixture-a-incomplete", "review_required", True),
        ("fixture-a-unsupported", "unsupported", False),
        ("fixture-a-wrong-association", "malformed", False),
        ("fixture-a-conflict", "malformed", False),
        ("fixture-a-missing-required", "malformed", False),
        ("fixture-a-bad-provenance", "malformed", False),
        ("fixture-a-unsupported-field", "unsupported", False),
        ("fixture-a-invalid-value", "malformed", False),
    ],
)
def test_validation_outcomes_are_durable_without_partial_invalid_reports(
    demo, fixture, category, stored
):
    a = demo.login("demo-a")
    grant(demo, a)
    response = ingest(a, fixture)
    assert response.status_code == 200 and response.json()["category"] == category
    with Session(demo.engine) as db:
        assert db.scalar(select(func.count()).select_from(ReportRecord)) == int(stored)
        assert db.scalar(select(func.count()).select_from(ReportRevision)) == int(stored)
        assert db.scalar(select(func.count()).select_from(ImportOutcome)) == 1
        assert db.get(CaseOwner, "syn-case-01").input_version == (2 if stored else 1)
    if stored:
        grant(demo, a)
        listing = a.get("/api/v1/reports").json()[0]
        assert listing["active_revision_handle"] is None
        item = view(a, listing["report_handle"], listing["versions"][0]["revision_handle"]).json()
        assert (
            item["revision"]["state"] == "review_required" and item["content"]["coverage"] is None
        )


def test_limited_coverage_never_becomes_absence_or_invented_observations(demo: DemoHarness):
    b = demo.login("demo-b")
    grant(demo, b)
    result = ingest(b, "fixture-b-limited").json()
    grant(demo, b)
    content = view(b, result["report_handle"]).json()["content"]
    assert content["coverage"]["excluded"] == ["syn-marker-lantern", "syn-marker-kite"]
    assert len(content["observations"]) == 1
    assert "limited-panel" in content["coverage"]["limitations"]
    assert "risk" not in content and "interpretation" not in content


def test_duplicate_idempotency_and_conflicting_payloads(demo: DemoHarness):
    a = demo.login("demo-a")
    grant(demo, a)
    key = str(uuid4())
    first = ingest(a, idempotency_key=key).json()
    grant(demo, a)
    repeat = ingest(a, idempotency_key=key, expected_input_version=1).json()
    assert repeat["replayed"] and repeat["revision_handle"] == first["revision_handle"]
    assert repeat["current_input_version"] == 2
    duplicate = ingest(a, "fixture-a-duplicate").json()
    assert duplicate["category"] == "duplicate" and duplicate["input_version_after"] == 2
    assert ingest(a, "fixture-a-incomplete", idempotency_key=key).status_code == 409
    assert ingest(a, expected_input_version=1).status_code == 409
    with Session(demo.engine) as db:
        assert db.scalar(select(func.count()).select_from(ReportRevision)) == 1
        assert db.scalar(select(func.count()).select_from(ImportOutcome)) == 2


def test_partner_and_professional_roles_never_gain_raw_report_access(demo: DemoHarness):
    a, b, joint = demo.pair()
    grant(demo, a)
    grant(demo, b)
    imported = ingest(a).json()
    grant(demo, a)
    for person in (a, b):
        assert demo.decide(person, "assessment", joint=joint, target=2).status_code == 200
    assert b.get(f"/api/v1/joints/{joint}/status").json()["status"] == "available_for_demo_review"
    denied = view(b, imported["report_handle"])
    missing = view(b, str(uuid4()))
    assert denied.status_code == missing.status_code == 404
    assert denied.json()["error"]["message"] == missing.json()["error"]["message"]
    for username in ("demo-support", "demo-counsellor"):
        person = demo.login(username)
        assert view(person, imported["report_handle"]).status_code == 404
        assert person.get("/api/v1/reports").status_code == 404
        assert person.get("/api/v1/reports/fixtures").status_code == 404
        assert person.get("/api/v1/reports/history").status_code == 404
        assert ingest_as_foreign(person).status_code == 404
    counsellor = demo.login("demo-counsellor")
    assert counsellor.get("/api/v1/private/cases/syn-case-01").status_code == 200
    assert counsellor.get("/api/v1/private/cases/syn-case-02").status_code == 404
    assert view(counsellor, imported["report_handle"]).status_code == 404


def ingest_as_foreign(client):
    return client.post(
        "/api/v1/reports/import",
        json={
            "fixture_id": "fixture-a-complete",
            "expected_input_version": 2,
            "idempotency_key": str(uuid4()),
        },
    )


def test_nested_revision_ownership_and_own_fixture_catalog(demo: DemoHarness):
    a, first = prepared(demo)
    b = demo.login("demo-b")
    grant(demo, b)
    second = ingest(b, "fixture-b-limited").json()
    grant(demo, b)
    assert view(a, first["report_handle"], second["revision_handle"]).status_code == 404
    assert view(b, first["report_handle"]).status_code == 404
    assert [entry["id"] for entry in b.get("/api/v1/reports/fixtures").json()] == [
        "fixture-b-limited"
    ]
    assert ingest(b, "fixture-a-complete").status_code == 404


@pytest.mark.parametrize(
    "reference",
    [
        "../valid/a-complete.json",
        "file:///etc/passwd",
        "fixture-" + "x" * 70,
        "fixture-a-complete?observations=1",
    ],
)
def test_malicious_or_oversized_references_are_not_file_inputs(demo: DemoHarness, reference):
    a = demo.login("demo-a")
    grant(demo, a)
    assert ingest(a, reference).status_code == 422
    assert (
        a.post(
            "/api/v1/reports/import",
            json={
                "fixture_id": "fixture-a-complete",
                "expected_input_version": 1,
                "idempotency_key": str(uuid4()),
                "report": {"synthetic": True},
            },
        ).status_code
        == 422
    )
    assert a.post("/api/v1/reports/upload", json={}).status_code == 404


def test_processing_withdrawal_expiry_forged_identity_and_csrf(demo: DemoHarness):
    a, imported = prepared(demo)
    assert view(a, imported["report_handle"]).status_code == 200
    for headers in ({"X-CSRF-Token": ""}, {"Origin": "https://untrusted.invalid"}):
        response = a.post(
            "/api/v1/reports/import",
            json={
                "fixture_id": "fixture-a-incomplete",
                "expected_input_version": 2,
                "idempotency_key": str(uuid4()),
            },
            headers=headers,
        )
        assert response.status_code == 403
    choice = grant(demo, a)
    assert (
        demo.decide(
            a,
            "processing",
            case="syn-case-01",
            target=2,
            version=choice["version"],
            decision="withdraw",
        ).status_code
        == 200
    )
    for path in ("/api/v1/reports", "/api/v1/reports/history"):
        assert a.get(path).status_code == 403
    assert view(a, imported["report_handle"]).status_code == 403
    assert amendment(a, imported["report_handle"]).status_code == 403
    grant(demo, a)
    with Session(demo.engine) as db, db.begin():
        session = db.get(DemoSession, digest(a.cookies.get(COOKIE_NAME)))
        session.expires_at = now() - timedelta(seconds=1)
    assert view(a, imported["report_handle"]).status_code == 401
    anonymous = demo.anonymous()
    assert (
        anonymous.get(
            "/api/v1/reports",
            headers={
                "X-Role": "individual",
                "X-User-ID": "demo-user-a",
                "Authorization": "Bearer invented",
            },
        ).status_code
        == 401
    )


def test_amendment_preserves_original_and_invalidates_reviewed_placeholder(demo: DemoHarness):
    a, b, joint, _ = demo.assessment_ready()
    original = ingest(a).json()
    grant(demo, a)
    for client in (a, b):
        assert demo.decide(client, "assessment", joint=joint, target=2).status_code == 200
    with Session(demo.engine) as db, db.begin():
        db.get(JointReview, joint).placeholder_reviewed = True  # Non-clinical TEST fixture only.
    for client in (a, b):
        assert demo.decide(client, "disclosure", joint=joint, target=2).status_code == 200
    assert b.get(f"/api/v1/joints/{joint}/output").status_code == 200
    before = view(a, original["report_handle"]).json()
    key = str(uuid4())
    corrected = amendment(a, original["report_handle"], idempotency_key=key)
    assert corrected.status_code == 200 and corrected.json()["input_version_after"] == 3
    assert b.get(f"/api/v1/joints/{joint}/output").status_code == 403
    assert b.get(f"/api/v1/joints/{joint}/status").json()["status"] == "unavailable"
    assert all(c["state"] == "superseded" for c in a.get("/api/v1/me/consents").json())
    grant(demo, a)
    versions = a.post(
        "/api/v1/reports/versions", json={"report_handle": original["report_handle"]}
    ).json()["versions"]
    assert [v["state"] for v in versions] == ["superseded", "active"]
    assert versions[1]["supersedes_revision_handle"] == versions[0]["revision_handle"]
    assert versions[0]["source_sha256"] == before["revision"]["source_sha256"]
    assert (
        view(a, original["report_handle"], original["revision_handle"]).json()["content"]
        == before["content"]
    )
    assert (
        view(a, original["report_handle"]).json()["content"]["observations"][0]["value"]
        == "demo-token-blue"
    )
    replay = amendment(
        a, original["report_handle"], idempotency_key=key, expected_input_version=2
    ).json()
    assert replay["replayed"] and replay["revision_handle"] == corrected.json()["revision_handle"]
    assert amendment(a, original["report_handle"], expected_input_version=2).status_code == 409
    duplicate = ingest(a).json()
    assert duplicate["category"] == "duplicate" and duplicate["current_input_version"] == 3
    assert (
        a.get("/api/v1/reports").json()[0]["active_revision_handle"]
        == corrected.json()["revision_handle"]
    )


def test_invalid_correction_does_not_overwrite_valid_source(demo: DemoHarness):
    a, imported = prepared(demo)
    before = view(a, imported["report_handle"]).json()
    result = amendment(a, imported["report_handle"], fixture_id="fixture-a-invalid-amend").json()
    assert result["category"] == "malformed" and result["input_version_after"] == 2
    assert view(a, imported["report_handle"]).json() == before
    assert a.get("/api/v1/reports/history").json()[0]["operation"] == "amend"


@pytest.mark.parametrize("operation", ["import", "amend"])
def test_actual_audit_write_failure_rolls_back_entire_report_and_permission_change(demo, operation):
    if operation == "amend":
        a, imported = prepared(demo)
    else:
        a, imported = demo.login("demo-a"), None
        grant(demo, a)

    def snapshot():
        with Session(demo.engine) as db:
            return (
                tuple(
                    db.scalar(select(func.count()).select_from(model))
                    for model in (ReportRecord, ReportRevision, ImportOutcome, ConsentEvent)
                ),
                db.get(CaseOwner, "syn-case-01").input_version,
                [
                    (c.id, c.state, c.version)
                    for c in db.scalars(select(Consent).order_by(Consent.id)).all()
                ],
                [(r.id, r.active_revision_id) for r in db.scalars(select(ReportRecord)).all()],
            )

    before = snapshot()
    with demo.engine.begin() as connection:
        connection.execute(
            text(
                "CREATE FUNCTION p04_test_audit_failure() RETURNS trigger AS $$ "
                "BEGIN IF NEW.action='report_validation' THEN "
                "RAISE EXCEPTION 'injected report audit failure'; END IF; "
                "RETURN NEW; END; $$ LANGUAGE plpgsql"
            )
        )
        connection.execute(
            text(
                "CREATE TRIGGER p04_test_audit_failure BEFORE INSERT ON p03_audit "
                "FOR EACH ROW EXECUTE FUNCTION p04_test_audit_failure()"
            )
        )
    try:
        response = amendment(a, imported["report_handle"]) if imported else ingest(a)
        assert response.status_code == 503 and "injected" not in response.text
        assert snapshot() == before
    finally:
        with demo.engine.begin() as connection:
            connection.execute(text("DROP TRIGGER p04_test_audit_failure ON p03_audit"))
            connection.execute(text("DROP FUNCTION p04_test_audit_failure()"))


@pytest.mark.parametrize(
    "statement",
    [
        "UPDATE p04_revisions SET source_sha256='tampered'",
        "DELETE FROM p04_revisions",
        "TRUNCATE p04_revisions",
        "UPDATE p04_import_outcomes SET category='accepted'",
        "TRUNCATE p04_import_outcomes",
        "UPDATE p04_reports SET owner_id='demo-user-b'",
    ],
)
def test_database_immutable_source_history_and_bound_identity(demo: DemoHarness, statement):
    prepared(demo)
    with pytest.raises(DBAPIError), demo.engine.begin() as connection:
        connection.execute(text(statement))


def test_database_cannot_reactivate_superseded_revision_or_bind_wrong_case(demo: DemoHarness):
    a, imported = prepared(demo)
    assert amendment(a, imported["report_handle"]).status_code == 200
    with pytest.raises(DBAPIError), demo.engine.begin() as connection:
        connection.execute(
            text("UPDATE p04_reports SET active_revision_id=:old"),
            {"old": imported["revision_handle"]},
        )
    with pytest.raises(DBAPIError), demo.engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO p04_reports (id,case_id,owner_id,source_report_id) "
                "VALUES (:id,'syn-case-02','demo-user-a','syn-test')"
            ),
            {"id": str(uuid4())},
        )


@pytest.mark.parametrize("withdraw_first", [True, False])
def test_concurrent_report_correction_and_processing_withdrawal_share_p03_order(
    demo, withdraw_first
):
    a, imported = prepared(demo)
    choice = grant(demo, a)

    def withdraw():
        return a.post(
            f"/api/v1/me/consents/{choice['id']}/withdraw",
            json={"expected_version": choice["version"], "idempotency_key": str(uuid4())},
        )

    def correct():
        return a.post(
            "/api/v1/reports/amend",
            json={
                "fixture_id": "fixture-a-amend",
                "report_handle": imported["report_handle"],
                "expected_revision": 1,
                "expected_input_version": 2,
                "idempotency_key": str(uuid4()),
            },
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        with demo.engine.begin() as blocker:
            blocker.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": GATE_KEY})
            first = pool.submit(withdraw if withdraw_first else correct)
            wait_for_lock_waiters(demo.engine, 1)
            second = pool.submit(correct if withdraw_first else withdraw)
            wait_for_lock_waiters(demo.engine, 2)
        first_result, second_result = first.result(timeout=10), second.result(timeout=10)
    assert first_result.status_code == 200
    assert second_result.status_code == (403 if withdraw_first else 409)
    assert view(a, imported["report_handle"]).status_code == 403
    with Session(demo.engine) as db:
        assert db.scalar(select(func.count()).select_from(ReportRevision)) == (
            1 if withdraw_first else 2
        )


def test_p04_downgrade_reupgrade_preserves_all_p03_rows(demo: DemoHarness, monkeypatch):
    prepared(demo)
    tables = ["p03_users", "p03_sessions", "p03_consent_events", "p03_audit", "p03_case_owners"]

    def counts():
        with demo.engine.connect() as connection:
            return [connection.scalar(text("SELECT count(*) FROM " + table)) for table in tables]

    before = counts()
    monkeypatch.setenv("AMANAH_DATABASE_URL", demo.config.database_url)
    migration = Config(str(LIBRARY_ROOT.parents[2] / "services/api/alembic.ini"))
    command.downgrade(migration, "0002_identity")
    assert counts() == before
    with demo.engine.connect() as connection:
        assert connection.scalar(text("SELECT to_regclass('p04_reports')")) is None
    command.upgrade(migration, "head")
    assert counts() == before
    command.check(migration)


def test_report_content_never_appears_in_logs_or_denial_errors(demo: DemoHarness, caplog):
    a, imported = prepared(demo)
    with caplog.at_level(logging.INFO, logger="amanah.requests"):
        assert view(a, imported["report_handle"]).status_code == 200
        assert view(a, str(uuid4())).status_code == 404
    messages = " ".join(r.getMessage() for r in caplog.records if r.name == "amanah.requests")
    for sensitive in (
        "syn-marker-orbit",
        "demo-token-amber",
        imported["report_handle"],
        "observations",
    ):
        assert sensitive not in messages
    with Session(demo.engine) as db:
        events = db.scalars(select(AuditEvent).where(AuditEvent.action.like("report%"))).all()
        assert events and all(event.resource_id is None for event in events)
    assert a.get("/api/v1/knowledge").json()["status"] == "unavailable"
