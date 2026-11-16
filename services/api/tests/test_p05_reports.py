import hashlib
import json
from uuid import uuid4

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session
from test_p03_postgres import DemoHarness
from test_p03_postgres import demo as demo
from test_p04_postgres import amendment, grant, ingest, view

from app.p03.models import CaseOwner, Consent
from app.p04.models import ReportRecord, ReportRevision
from app.p04.validation import LIBRARY_ROOT, catalog, validate_fixture, validate_payload

V2 = [entry for entry in catalog() if entry.schema_version == "amanah-report-2"]


@pytest.mark.parametrize("entry", V2, ids=lambda e: e.id)
def test_v2_fixture_matches_declared_manifest_outcome(entry):
    result = validate_fixture(entry)
    assert result.category == entry.expected and result.source_hash == entry.sha256
    assert result.report is not None and result.report.schema_version == "amanah-report-2"
    assert "observations" in result.report.model_dump() and "risk" not in result.report.model_dump()


@pytest.mark.parametrize(
    ("change", "expected"),
    [
        ("unknown_gene", "unsupported"),
        ("old_panel", "unsupported"),
        ("duplicate_gene", "malformed"),
        ("outside_coverage", "malformed"),
        ("missing_observation", "review_required"),
        ("excluded_gene", "review_required"),
        ("uncertain_validity", "review_required"),
        ("variant_fields", "unsupported"),
        ("empty_observations", "review_required"),
    ],
)
def test_v2_unknown_and_incomplete_inputs_never_become_absent_or_interpreted(change, expected):
    entry = V2[0]
    body = json.loads((LIBRARY_ROOT / entry.file).read_bytes())
    if change == "unknown_gene":
        body["observations"][0]["gene_symbol"] = "UNKNOWN"
        body["coverage"]["included_genes"][0] = "UNKNOWN"
    elif change == "old_panel":
        body["panel_version"] = "0" * 64
    elif change == "duplicate_gene":
        body["observations"][1]["gene_symbol"] = body["observations"][0]["gene_symbol"]
    elif change == "outside_coverage":
        body["coverage"]["included_genes"].remove("CFTR")
    elif change == "missing_observation":
        body["observations"].pop()
    elif change == "excluded_gene":
        body["coverage"]["included_genes"].remove("CFTR")
        body["coverage"]["excluded_genes"].append("CFTR")
        body["observations"] = [o for o in body["observations"] if o["gene_symbol"] != "CFTR"]
    elif change == "uncertain_validity":
        body["observations"][0]["validity"] = "uncertain"
    elif change == "variant_fields":
        body["observations"][0]["variant_details"] = {}
    elif change == "empty_observations":
        body["observations"] = []
    raw = json.dumps(body).encode()
    result = validate_payload(
        raw, entry.model_copy(update={"sha256": hashlib.sha256(raw).hexdigest()})
    )
    assert result.category == expected
    if expected == "review_required":
        assert result.reasons == ["unknown_not_absent"]


def scenario(client, fixture, **extra):
    version = client.get("/api/v1/me/cases").json()[0]["input_version"]
    return client.post(
        "/api/v1/reports/scenario",
        json={
            "fixture_id": fixture,
            "expected_input_version": version,
            "idempotency_key": str(uuid4()),
            **extra,
        },
    )


@pytest.mark.integration
def test_v2_switching_reuses_sources_but_requires_new_processing_and_keeps_v1_semantics(
    demo: DemoHarness,
):
    a = demo.login("demo-a")
    grant(demo, a)
    assert (
        len(a.get("/api/v1/reports/fixtures").json()) == 12
    )  # Original catalogue remains unchanged.
    assert len(a.get("/api/v1/reports/gene-fixtures").json()) == 4
    key = str(uuid4())
    first = scenario(a, "fixture-a-v2-none", idempotency_key=key).json()
    assert first["category"] == "accepted" and first["current_input_version"] == 2
    assert view(a, first["report_handle"]).status_code == 403
    grant(demo, a)
    replay = scenario(a, "fixture-a-v2-none", idempotency_key=key, expected_input_version=1).json()
    assert replay["replayed"] and replay["current_input_version"] == 2
    assert all(
        o["status"] == "no_pathogenic_variant_detected"
        for o in view(a, first["report_handle"]).json()["content"]["observations"]
    )
    second = scenario(a, "fixture-a-v2-carrier-cftr").json()
    grant(demo, a)
    assert second["current_input_version"] == 3
    duplicate = ingest(a, "fixture-a-v2-none").json()
    assert duplicate["category"] == "duplicate" and duplicate["current_input_version"] == 3
    rows = a.get("/api/v1/reports").json()
    assert sum(bool(r["selected_gene_scenario"]) for r in rows) == 1
    third = scenario(a, "fixture-a-v2-none").json()
    assert third["category"] == "accepted" and third["current_input_version"] == 4
    grant(demo, a)
    assert scenario(a, "fixture-a-v2-none").json()["category"] == "duplicate"
    assert scenario(a, "fixture-a-complete").status_code == 409
    with Session(demo.engine) as db:
        assert db.scalar(select(func.count()).select_from(ReportRevision)) == 2
        assert db.get(CaseOwner, "syn-case-01").input_version == 4


@pytest.mark.integration
def test_v2_predefined_amendment_is_immutable_invalidates_joint_and_rejects_old_source(demo):
    a, b, joint, _ = demo.assessment_ready()
    first = scenario(a, "fixture-a-v2-none").json()
    grant(demo, a)
    for person in (a, b):
        assert demo.decide(person, "assessment", joint=joint, target=2).status_code == 200
    assert b.get(f"/api/v1/joints/{joint}/status").json()["status"] == "available_for_demo_review"
    corrected = amendment(
        a, first["report_handle"], fixture_id="fixture-a-v2-amend-none-cftr"
    ).json()
    assert corrected["category"] == "accepted" and corrected["current_input_version"] == 3
    assert b.get(f"/api/v1/joints/{joint}/status").json()["status"] == "unavailable"
    assert all(c["state"] == "superseded" for c in a.get("/api/v1/me/consents").json())
    grant(demo, a)
    original = view(a, first["report_handle"], first["revision_handle"]).json()
    latest = view(a, first["report_handle"]).json()

    def status(body):
        return next(
            o["status"] for o in body["content"]["observations"] if o["gene_symbol"] == "CFTR"
        )

    assert status(original) == "no_pathogenic_variant_detected" and status(latest) == "carrier"
    assert scenario(a, "fixture-a-v2-none").status_code == 409
    switched = scenario(a, "fixture-a-v2-carrier-hbb").json()
    grant(demo, a)
    assert switched["category"] == "accepted"
    selected = scenario(a, "fixture-a-v2-amend-none-cftr").json()
    grant(demo, a)
    assert (
        selected["category"] == "accepted"
        and selected["revision_handle"] == corrected["revision_handle"]
    )
    assert view(b, first["report_handle"]).status_code == 404


@pytest.mark.integration
def test_v2_uncertainty_selection_and_scenario_denials(demo):
    b = demo.login("demo-b")
    grant(demo, b)
    result = scenario(b, "fixture-b-v2-uncertain-cftr").json()
    grant(demo, b)
    assert result["category"] == "review_required"
    assert view(b, result["report_handle"]).status_code == 404  # No active interpreted source.
    assert view(b, result["report_handle"], result["revision_handle"]).status_code == 200
    gap = scenario(b, "fixture-b-v2-cftr-not-tested").json()
    grant(demo, b)
    assert gap["category"] == "review_required" and gap["current_input_version"] == 3
    assert scenario(b, "fixture-a-v2-none").status_code == 404
    assert (
        b.post(
            "/api/v1/reports/scenario",
            json={
                "fixture_id": "fixture-b-v2-none",
                "expected_input_version": 3,
                "idempotency_key": str(uuid4()),
            },
            headers={"X-CSRF-Token": ""},
        ).status_code
        == 403
    )
    choice = grant(demo, b)
    assert (
        demo.decide(
            b,
            "processing",
            case="syn-case-02",
            target=3,
            version=choice["version"],
            decision="withdraw",
        ).status_code
        == 200
    )
    assert scenario(b, "fixture-b-v2-none").status_code == 403


@pytest.mark.integration
def test_scenario_audit_failure_rolls_back_head_selection_and_input(demo):
    a = demo.login("demo-a")
    grant(demo, a)
    first = scenario(a, "fixture-a-v2-none").json()
    grant(demo, a)
    with demo.engine.begin() as c:
        c.execute(
            text(
                "CREATE FUNCTION p05_audit_fault() RETURNS trigger AS $$ "
                "BEGIN IF NEW.action='report_validation' THEN "
                "RAISE EXCEPTION 'synthetic test fault'; END IF; "
                "RETURN NEW; END; $$ LANGUAGE plpgsql"
            )
        )
        c.execute(
            text(
                "CREATE TRIGGER p05_audit_fault BEFORE INSERT ON p03_audit "
                "FOR EACH ROW EXECUTE FUNCTION p05_audit_fault()"
            )
        )
    try:
        assert scenario(a, "fixture-a-v2-carrier-cftr").status_code == 503
        with Session(demo.engine) as db:
            assert db.scalar(select(func.count()).select_from(ReportRevision)) == 1
            assert (
                db.get(ReportRecord, first["report_handle"]).active_revision_id
                == first["revision_handle"]
            )
            assert db.get(CaseOwner, "syn-case-01").input_version == 2
            assert db.scalar(select(Consent.state).where(Consent.target_version == 2)) == "granted"
    finally:
        with demo.engine.begin() as c:
            c.execute(text("DROP TRIGGER p05_audit_fault ON p03_audit"))
            c.execute(text("DROP FUNCTION p05_audit_fault()"))
