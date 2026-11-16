import json
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session
from test_p03_postgres import demo as demo
from test_p04_postgres import amendment, grant, ingest
from test_p05_reports import scenario

from app.database import Base
from app.p03.models import AuditEvent, JointReview
from app.p06 import provider
from app.p06.references import LoadedReferences
from app.p06.schemas import Unavailable

pytestmark = pytest.mark.integration
OWN = "/api/v1/risk/my-assessment"
COUPLE = "/api/v1/risk/couple-assessment"


def educational(client, scope, *, case=None, joint=None, target=1, decision="grant"):
    key = (
        f"assessment:{case}:v{target}:educational_risk"
        if case
        else f"disclosure:{joint}:v{target}:participants:educational_risk"
    )
    prior = next(
        (c for c in client.get("/api/v1/me/consents").json() if c["scope_key"] == key), None
    )
    return client.post(
        "/api/v1/me/consents",
        json={
            "scope": scope,
            "purpose": "educational_risk",
            "case_id": case,
            "joint_id": joint,
            "target_version": target,
            "decision": decision,
            "expected_version": prior["version"] if prior else 0,
            "idempotency_key": str(uuid4()),
        },
    )


def ready(demo, a, b, joint):
    for client in (a, b):
        grant(demo, client)
        j = next(x for x in client.get("/api/v1/me/joints").json() if x["id"] == joint)
        choices = client.get("/api/v1/me/consents").json()
        old = next(
            (c for c in choices if c["scope_key"] == f"assessment:{joint}:v{j['version']}"), None
        )
        assert (
            demo.decide(
                client,
                "assessment",
                joint=joint,
                target=j["version"],
                version=old["version"] if old else 0,
            ).status_code
            == 200
        )
        assert (
            educational(client, "disclosure", joint=joint, target=j["output_version"]).status_code
            == 200
        )


def test_owner_requires_purpose_scoped_assessment_and_withdrawal_rejects_pin(demo):
    a = demo.login("demo-a")
    grant(demo, a)
    assert scenario(a, "fixture-a-v2-none").status_code == 200
    grant(demo, a)
    assert a.get(OWN).status_code == 403
    consent = educational(a, "assessment", case="syn-case-01", target=2)
    assert consent.status_code == 200
    out = a.get(OWN)
    assert out.status_code == 200
    assert all(not g["numbers"] for g in out.json()["genes"])
    pin = out.json()["bindings"]["scope_hash"]
    assert a.get(OWN, headers={"X-Risk-Binding": pin}).content == out.content
    record = consent.json()
    assert (
        a.post(
            f"/api/v1/me/consents/{record['id']}/withdraw",
            json={"expected_version": record["version"], "idempotency_key": str(uuid4())},
        ).status_code
        == 200
    )
    stale = a.get(OWN, headers={"X-Risk-Binding": pin})
    assert stale.status_code == 409 and stale.json()["error"]["code"] == "STALE_BINDING"
    assert a.get(OWN).status_code == 403
    for role in ("demo-support", "demo-counsellor"):
        assert demo.login(role).get(OWN).status_code == 404
    assert demo.anonymous().get(OWN).status_code == 401


@pytest.mark.parametrize(
    ("af", "bf", "shared"),
    [
        ("a-v2-none", "b-v2-none", []),
        ("a-v2-carrier-cftr", "b-v2-none", []),
        ("a-v2-carrier-cftr", "b-v2-carrier-hbb", []),
        ("a-v2-carrier-cftr", "b-v2-carrier-cftr", ["CFTR"]),
        ("a-v2-carrier-hbb", "b-v2-carrier-hbb", ["HBB"]),
    ],
)
def test_joint_release_is_only_shared_intersection_not_partner_only_findings(demo, af, bf, shared):
    a, b, joint = demo.pair()
    for client, fixture in ((a, af), (b, bf)):
        grant(demo, client)
        assert scenario(client, "fixture-" + fixture).status_code == 200
    ready(demo, a, b, joint)
    for client in (a, b):
        out = client.get(COUPLE).json()
        assert [g["gene_symbol"] for g in out["genes"]] == shared
        assert out["state"] == ("SHARED_CARRIER" if shared else "NO_SHARED_FINDING")
        assert "source_report_id" not in json.dumps(out)
        if shared:
            assert out["genes"][0]["numbers"]["affected"]["exact"] == {"num": 1, "den": 4}
            assert "GENE_LEVEL_ONLY" in out["genes"][0]["caveat_codes"]
    assert a.get(f"/api/v1/joints/{joint}/output").status_code == 403
    # Educational consent never fabricates the old reviewed-placeholder state.
    with Session(demo.engine) as db:
        assert db.get(JointReview, joint).placeholder_reviewed is False
        audits = list(db.scalars(select(AuditEvent).where(AuditEvent.action == "risk_couple")))
        assert len(audits) == 2 and all(
            e.purpose == "educational_risk" and e.resource_id is None for e in audits
        )


def test_neutral_bodies_identical_for_absent_declined_withdrawn_and_amended(demo):
    a, b = demo.login("demo-a"), demo.login("demo-b")
    expected = Unavailable().model_dump()
    absent = a.get(COUPLE)
    created = a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).json()
    assert (
        b.post(
            f"/api/v1/invitations/{created['id']}/decision",
            json={"token": created["delivery_token"], "decision": "decline"},
        ).status_code
        == 200
    )
    declined = a.get(COUPLE)
    # Enrol one joint without granting permissions; withdrawing its assessment is indistinguishable.
    created = a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).json()
    joint = b.post(
        f"/api/v1/invitations/{created['id']}/decision",
        json={"token": created["delivery_token"], "decision": "accept"},
    ).json()["joint_id"]
    for client, fixture in ((a, "a-v2-none"), (b, "b-v2-carrier-cftr")):
        grant(demo, client)
        assert scenario(client, "fixture-" + fixture).status_code == 200
    ready(demo, a, b, joint)
    choice = next(
        c for c in b.get("/api/v1/me/consents").json() if c["scope_key"] == f"assessment:{joint}:v3"
    )
    assert (
        demo.decide(
            b, "assessment", joint=joint, target=3, version=choice["version"], decision="withdraw"
        ).status_code
        == 200
    )
    withdrawn = a.get(COUPLE)
    ready(demo, a, b, joint)
    previous = a.get(COUPLE).json()["bindings"]["scope_hash"]
    own_report = next(r for r in a.get("/api/v1/reports").json() if r["selected_gene_scenario"])
    assert (
        amendment(
            a, own_report["report_handle"], fixture_id="fixture-a-v2-amend-none-cftr"
        ).status_code
        == 200
    )
    amended = a.get(COUPLE, headers={"X-Risk-Binding": previous})
    for response in (absent, declined, withdrawn, amended):
        assert response.status_code == 200 and response.json() == expected
    ready(demo, a, b, joint)
    assert a.get(COUPLE, headers={"X-Risk-Binding": previous}).json() == expected
    assert a.get(COUPLE).json()["state"] == "SHARED_CARRIER"


@pytest.mark.parametrize("fixture", ["b-v2-uncertain-cftr", "b-v2-cftr-not-tested"])
def test_unresolved_current_sources_never_fall_back_or_emit_numbers(demo, fixture):
    a, b, joint = demo.pair()
    for c, f in ((a, "a-v2-carrier-cftr"), (b, fixture)):
        grant(demo, c)
        scenario(c, "fixture-" + f)
    ready(demo, a, b, joint)
    out = a.get(COUPLE).json()
    assert out["state"] == "REVIEW_REQUIRED" and out["genes"] == [] and out["numbers"] == {}


def test_whatif_public_stateless_no_audit_routes_and_strict_bounds(demo):
    a = demo.login("demo-a")
    with Session(demo.engine) as db:
        counts = {
            t: db.scalar(select(func.count()).select_from(t)) for t in Base.metadata.tables.values()
        }
    body = {
        "mode": "mendelian",
        "gene_symbol": "CFTR",
        "a_status": "carrier",
        "b_status": "carrier",
    }
    assert a.post("/api/v1/risk/whatif", json=body, headers={"X-CSRF-Token": ""}).status_code == 200
    assert demo.anonymous().post("/api/v1/risk/whatif", json=body).status_code == 200
    with Session(demo.engine) as db:
        assert all(db.scalar(select(func.count()).select_from(t)) == n for t, n in counts.items())
    for path in (OWN, COUPLE):
        assert a.post(path, json=body).status_code == 405
    assert a.get("/api/v1/risk/whatif").status_code == 405
    assert a.post("/api/v1/risk/other", json=body).status_code == 404
    assert (
        a.post(
            "/api/v1/risk/whatif", content=b"x" * 4097, headers={"Content-Type": "application/json"}
        ).status_code
        == 413
    )
    assert a.post("/api/v1/risk/whatif", json={**body, "extra": "fictional"}).status_code == 422


def test_required_audit_failure_never_releases_an_assessment(demo):
    a = demo.login("demo-a")
    grant(demo, a)
    scenario(a, "fixture-a-v2-none")
    grant(demo, a)
    educational(a, "assessment", case="syn-case-01", target=2)
    with demo.engine.begin() as db:
        db.execute(
            text(
                "CREATE FUNCTION p06_audit_fault() RETURNS trigger AS $$ BEGIN "
                "IF NEW.action='risk_own' THEN RAISE EXCEPTION 'synthetic fault'; "
                "END IF; RETURN NEW; END; $$ LANGUAGE plpgsql"
            )
        )
        db.execute(
            text(
                "CREATE TRIGGER p06_audit_fault BEFORE INSERT ON p03_audit "
                "FOR EACH ROW EXECUTE FUNCTION p06_audit_fault()"
            )
        )
    try:
        assert a.get(OWN).status_code == 503
    finally:
        with demo.engine.begin() as db:
            db.execute(text("DROP TRIGGER p06_audit_fault ON p03_audit"))
            db.execute(text("DROP FUNCTION p06_audit_fault()"))


def test_withdrawal_and_release_are_serialized_and_pin_never_survives(demo):
    a = demo.login("demo-a")
    grant(demo, a)
    scenario(a, "fixture-a-v2-none")
    grant(demo, a)
    consent = educational(a, "assessment", case="syn-case-01", target=2).json()
    pin = a.get(OWN).json()["bindings"]["scope_hash"]
    other = demo.anonymous()
    other.cookies.update(a.cookies)
    other.headers.update(a.headers)
    with ThreadPoolExecutor(max_workers=2) as pool:
        read = pool.submit(a.get, OWN, headers={"X-Risk-Binding": pin})
        withdraw = pool.submit(
            other.post,
            f"/api/v1/me/consents/{consent['id']}/withdraw",
            json={"expected_version": consent["version"], "idempotency_key": str(uuid4())},
        )
        assert withdraw.result().status_code == 200
        assert read.result().status_code in (200, 409)
    assert a.get(OWN, headers={"X-Risk-Binding": pin}).status_code == 409


@pytest.mark.parametrize("changed", ["rules", "references"])
def test_rules_and_reference_changes_reject_old_binding(demo, monkeypatch, changed):
    a = demo.login("demo-a")
    grant(demo, a)
    scenario(a, "fixture-a-v2-none")
    grant(demo, a)
    educational(a, "assessment", case="syn-case-01", target=2)
    pin = a.get(OWN).json()["bindings"]["scope_hash"]
    if changed == "rules":
        monkeypatch.setattr(provider, "rules_hash", lambda: "a" * 64)
    else:
        refs = provider.load_references()
        monkeypatch.setattr(
            provider, "load_references", lambda: LoadedReferences(refs.data, "a" * 64)
        )
    response = a.get(OWN, headers={"X-Risk-Binding": pin})
    assert response.status_code == 409 and response.json()["error"]["code"] == "STALE_BINDING"


def test_latest_v1_input_cannot_fall_back_to_an_older_v2_assessment(demo):
    a = demo.login("demo-a")
    grant(demo, a)
    scenario(a, "fixture-a-v2-carrier-cftr")
    grant(demo, a)
    educational(a, "assessment", case="syn-case-01", target=2)
    pin = a.get(OWN).json()["bindings"]["scope_hash"]
    assert ingest(a).status_code == 200
    grant(demo, a)
    educational(a, "assessment", case="syn-case-01", target=3)
    assert a.get(OWN, headers={"X-Risk-Binding": pin}).status_code == 409
    response = a.get(OWN).json()
    assert response["state"] == "UNSUPPORTED" and not response["genes"] and not response["numbers"]
    # Explicit re-selection after a v1 input must advance the scope instead of replaying stale v2.
    restored = scenario(a, "fixture-a-v2-carrier-cftr").json()
    assert restored["category"] == "accepted" and restored["current_input_version"] == 4
    grant(demo, a)
    educational(a, "assessment", case="syn-case-01", target=4)
    assert a.get(OWN).json()["state"] == "COMPUTED"


def test_explicit_joint_selection_is_member_only_and_preserves_default_deny(demo):
    a, b, joint = demo.pair()
    ready(demo, a, b, joint)
    invitation = a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).json()
    assert (
        b.post(
            f"/api/v1/invitations/{invitation['id']}/decision",
            json={"token": invitation["delivery_token"], "decision": "accept"},
        ).status_code
        == 200
    )
    assert a.get(COUPLE).json() == Unavailable().model_dump()
    assert a.get(COUPLE, headers={"X-Risk-Joint": joint}).json()["state"] == "REVIEW_REQUIRED"
    for selected in (str(uuid4()), "invalid", "x" * 4096):
        assert (
            a.get(COUPLE, headers={"X-Risk-Joint": selected}).json() == Unavailable().model_dump()
        )
    support = demo.login("demo-support")
    assert support.get(COUPLE, headers={"X-Risk-Joint": joint}).json() == Unavailable().model_dump()
