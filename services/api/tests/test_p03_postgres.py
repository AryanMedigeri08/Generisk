import json
import os
import time
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from app.config import Settings
from app.main import create_app
from app.p03.models import (
    AuditEvent,
    Consent,
    ConsentEvent,
    DemoSession,
    DemoUser,
    Invitation,
    JointReview,
    RateBucket,
)
from app.p03.security import COOKIE_NAME, digest, now
from app.p03.service import GATE_KEY
from app.seed import seed_fixtures
from app.seed_identity import seed_accounts

pytestmark = pytest.mark.integration
HEADERS = {"Origin": "http://localhost:13000", "X-Demo-Request": "1"}


class DemoHarness:
    def __init__(self, app: FastAPI, engine: Engine, config: Settings) -> None:
        self.app, self.engine, self.config = app, engine, config
        self.clients: list[TestClient] = []

    def anonymous(self) -> TestClient:
        client = TestClient(self.app, headers=HEADERS)
        client.__enter__()
        self.clients.append(client)
        return client

    def login(self, username: str) -> TestClient:
        client = self.anonymous()
        csrf = client.get("/api/v1/auth/csrf")
        assert csrf.status_code == 200
        client.headers["X-CSRF-Token"] = csrf.json()["csrf_token"]
        response = client.post(
            "/api/v1/auth/login", json={"username": username, "password": username + "-only"}
        )
        assert response.status_code == 200
        client.headers["X-CSRF-Token"] = response.json()["csrf_token"]
        return client

    def decide(
        self,
        client: TestClient,
        scope: str,
        *,
        case: str | None = None,
        joint: str | None = None,
        decision: str = "grant",
        version: int = 0,
        target: int = 1,
        key: str | None = None,
    ):
        return client.post(
            "/api/v1/me/consents",
            json={
                "scope": scope,
                "case_id": case,
                "joint_id": joint,
                "decision": decision,
                "expected_version": version,
                "target_version": target,
                "idempotency_key": key or str(uuid4()),
            },
        )

    def pair(self) -> tuple[TestClient, TestClient, str]:
        a, b = self.login("demo-a"), self.login("demo-b")
        created = a.post("/api/v1/invitations", json={"recipient_username": "demo-b"})
        assert created.status_code == 200
        body = created.json()
        accepted = b.post(
            f"/api/v1/invitations/{body['id']}/decision",
            json={
                "token": body["delivery_token"],
                "decision": "accept",
            },
        )
        assert accepted.status_code == 200
        return a, b, accepted.json()["joint_id"]

    def assessment_ready(self) -> tuple[TestClient, TestClient, str, dict]:
        a, b, joint = self.pair()
        for client, case in [(a, "syn-case-01"), (b, "syn-case-02")]:
            assert self.decide(client, "processing", case=case).status_code == 200
            result = self.decide(client, "assessment", joint=joint)
            assert result.status_code == 200
        return a, b, joint, result.json()

    def disclosure_ready(self) -> tuple[TestClient, TestClient, str, dict]:
        a, b, joint, consent = self.assessment_ready()
        # Explicit non-clinical test fixture ONLY: not a real clinical review or runtime feature.
        with Session(self.engine) as db, db.begin():
            record = db.get(JointReview, joint)
            assert record is not None
            record.placeholder_reviewed = True
        for client in (a, b):
            assert self.decide(client, "disclosure", joint=joint).status_code == 200
        return a, b, joint, consent

    def close(self) -> None:
        for client in reversed(self.clients):
            client.__exit__(None, None, None)


@pytest.fixture
def demo(monkeypatch: pytest.MonkeyPatch) -> Iterator[DemoHarness]:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL absent: real P03 PostgreSQL verification NOT RUN")
    if not (make_url(url).database or "").endswith("_test"):
        pytest.fail("P03 destructive test fixture requires a disposable _test database")
    monkeypatch.setenv("AMANAH_DATABASE_URL", url)
    root = Path(__file__).resolve().parents[3]
    migration = Config(str(root / "services/api/alembic.ini"))
    command.downgrade(migration, "base")
    command.upgrade(migration, "head")
    seed_fixtures(url, root / "data/synthetic/demo-cases.json")
    assert seed_accounts(url) == 4
    assert seed_accounts(url) == 4
    config = Settings(database_url=url)
    engine = create_engine(url)
    harness = DemoHarness(create_app(config, engine), engine, config)
    yield harness
    harness.close()
    engine.dispose()


def test_login_logout_hashes_cookie_and_revocation(demo: DemoHarness) -> None:
    a = demo.login("demo-a")
    response = a.get("/api/v1/auth/session")
    assert response.json()["user_id"] == "demo-user-a"
    assert response.json()["role"] == "individual"
    raw = a.cookies.get(COOKIE_NAME)
    with Session(demo.engine) as db:
        record = db.get(DemoSession, digest(raw))
        assert record is not None and record.user_id == "demo-user-a"
        users = db.scalars(select(DemoUser)).all()
        assert len(users) == 4 and all(
            user.password_hash.startswith("$argon2id$") for user in users
        )
    assert a.post("/api/v1/auth/logout").status_code == 200
    a.cookies.set(COOKIE_NAME, raw)
    assert a.get("/api/v1/auth/session").status_code == 401


def test_wrong_password_and_login_csrf(demo: DemoHarness) -> None:
    client = demo.anonymous()
    assert (
        client.post(
            "/api/v1/auth/login", json={"username": "demo-a", "password": "demo-a-only"}
        ).status_code
        == 403
    )
    challenge = client.get("/api/v1/auth/csrf")
    cookie = challenge.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie and "secure" not in cookie
    client.headers["X-CSRF-Token"] = challenge.json()["csrf_token"]
    wrong = client.post(
        "/api/v1/auth/login", json={"username": "demo-a", "password": "fictional-wrong-password"}
    )
    unknown = client.post(
        "/api/v1/auth/login",
        json={"username": "unknown-demo", "password": "fictional-wrong-password"},
    )
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json()["error"]["message"] == unknown.json()["error"]["message"]


def test_expired_session_is_rejected(demo: DemoHarness) -> None:
    a = demo.login("demo-a")
    with Session(demo.engine) as db, db.begin():
        record = db.get(DemoSession, digest(a.cookies.get(COOKIE_NAME)))
        assert record is not None
        record.expires_at = now() - timedelta(seconds=1)
    assert a.get("/api/v1/auth/session").status_code == 401
    assert a.get("/api/v1/private/cases/syn-case-01").status_code == 401


def test_secure_cookie_for_explicit_local_https(demo: DemoHarness) -> None:
    config = Settings(
        database_url=demo.config.database_url,
        web_origin="https://localhost:13000",
        cookie_secure=True,
    )
    with TestClient(create_app(config), base_url="https://localhost:13000") as client:
        response = client.get(
            "/api/v1/auth/csrf", headers={"Origin": config.web_origin, "X-Demo-Request": "1"}
        )
        assert response.status_code == 200
        assert "secure" in response.headers["set-cookie"].lower()


def test_hosted_login_origin_rotation_and_restart(
    demo: DemoHarness, monkeypatch: pytest.MonkeyPatch
) -> None:
    origin = "https://judges.example.org"
    config = Settings(
        hosted_demo=True,
        web_origin=origin,
        cookie_secure=True,
        database_url=demo.config.database_url.replace("postgresql+psycopg:", "postgresql:"),
    )
    assert config.database_url == demo.config.database_url
    for role in ("A", "B", "COUNSELLOR", "SUPPORT"):
        monkeypatch.setenv(f"AMANAH_PASSWORD_{role}", str(uuid4()))
    password = os.environ["AMANAH_PASSWORD_A"]
    seed_accounts(config.database_url, hosted=True)
    headers = {"Origin": origin, "X-Demo-Request": "1"}
    with TestClient(create_app(config), base_url=origin, headers=headers) as client:
        for other in ("https://a-preview.example.org", HEADERS["Origin"], origin + "/path"):
            assert client.get("/api/v1/auth/csrf", headers={"Origin": other}).status_code == 403
        challenge = client.get("/api/v1/auth/csrf")
        assert "secure" in challenge.headers["set-cookie"].lower()
        client.headers["X-CSRF-Token"] = challenge.json()["csrf_token"]
        endpoint = "/api/v1/auth/login"
        assert (
            client.post(
                endpoint, json={"username": "demo-a", "password": "demo-a-only"}
            ).status_code
            == 401
        )
        assert (
            client.post(endpoint, json={"username": "demo-a", "password": password}).status_code
            == 200
        )
        seed_accounts(config.database_url, hosted=True)
        assert client.get("/api/v1/auth/session").status_code == 200
        monkeypatch.setenv("AMANAH_PASSWORD_A", str(uuid4()))
        seed_accounts(config.database_url, hosted=True)
        assert client.get("/api/v1/auth/session").status_code == 401


def test_owner_cross_user_and_header_forgery(demo: DemoHarness) -> None:
    a, b = demo.login("demo-a"), demo.login("demo-b")
    assert a.get("/api/v1/private/cases/syn-case-01").status_code == 200
    assert b.get("/api/v1/private/cases/syn-case-02").status_code == 200
    for client, other in [(a, "syn-case-02"), (b, "syn-case-01")]:
        response = client.get(
            "/api/v1/private/cases/" + other,
            headers={"X-Role": "support", "X-User-ID": "demo-user-a"},
        )
        assert response.status_code == 404
    anonymous = demo.anonymous()
    assert (
        anonymous.get(
            "/api/v1/private/cases/syn-case-01",
            headers={"Authorization": "Bearer invented", "X-Role": "counsellor"},
        ).status_code
        == 401
    )


def test_support_and_professional_assignment_permission(demo: DemoHarness) -> None:
    a, b = demo.login("demo-a"), demo.login("demo-b")
    support, counsellor = demo.login("demo-support"), demo.login("demo-counsellor")
    assert support.get("/api/v1/me/cases").json() == []
    assert support.get("/api/v1/private/cases/syn-case-01").status_code == 404
    assert counsellor.get("/api/v1/private/cases/syn-case-01").status_code == 404
    assert demo.decide(a, "processing", case="syn-case-01").status_code == 200
    assert demo.decide(b, "processing", case="syn-case-02").status_code == 200
    assert counsellor.get("/api/v1/private/cases/syn-case-01").status_code == 200
    assert counsellor.get("/api/v1/private/cases/syn-case-02").status_code == 404
    assert [case["id"] for case in counsellor.get("/api/v1/professional/cases").json()] == [
        "syn-case-01"
    ]
    assert support.get("/api/v1/professional/cases").status_code == 404


def test_invitation_acceptance_is_independent_and_does_not_grant_consent(demo: DemoHarness) -> None:
    a, b, joint = demo.pair()
    assert a.get("/api/v1/me/consents").json() == b.get("/api/v1/me/consents").json() == []
    status = a.get(f"/api/v1/joints/{joint}/status").json()
    assert status["status"] == "unavailable" and not status["can_disclose"]


def test_invitation_wrong_recipient_token_replay_and_forwarding(demo: DemoHarness) -> None:
    a, b = demo.login("demo-a"), demo.login("demo-b")
    created = a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).json()
    other = a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).json()
    path = f"/api/v1/invitations/{created['id']}/decision"
    payload = {"token": created["delivery_token"], "decision": "accept"}
    assert a.post(path, json=payload).status_code == 404
    assert b.post(path, json={**payload, "token": "invented-invalid-token-long"}).status_code == 404
    assert b.post(path, json={**payload, "token": other["delivery_token"]}).status_code == 404
    assert b.post(path, json=payload).status_code == 200
    assert b.post(path, json=payload).status_code == 404
    assert len(b.get("/api/v1/me/joints").json()) == 1


def test_expired_invitation_and_private_decline_are_neutral_to_sender(demo: DemoHarness) -> None:
    a, b = demo.login("demo-a"), demo.login("demo-b")
    invite = a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).json()
    before = a.get(f"/api/v1/invitations/{invite['id']}").json()
    assert (
        b.post(
            f"/api/v1/invitations/{invite['id']}/decision",
            json={"token": invite["delivery_token"], "decision": "decline"},
        ).status_code
        == 200
    )
    assert a.get(f"/api/v1/invitations/{invite['id']}").json() == before
    expired = a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).json()
    with Session(demo.engine) as db, db.begin():
        record = db.get(Invitation, expired["id"])
        assert record is not None
        record.expires_at = now() - timedelta(seconds=1)
    assert (
        b.post(
            f"/api/v1/invitations/{expired['id']}/decision",
            json={"token": expired["delivery_token"], "decision": "accept"},
        ).status_code
        == 404
    )
    assert a.get(f"/api/v1/invitations/{expired['id']}").json()["status"] == "unavailable"


def test_csrf_checks_token_origin_fetch_site_and_no_on_behalf_grants(demo: DemoHarness) -> None:
    a = demo.login("demo-a")
    payload = {
        "scope": "processing",
        "case_id": "syn-case-01",
        "target_version": 1,
        "expected_version": 0,
        "decision": "grant",
        "idempotency_key": str(uuid4()),
    }
    for headers in [
        {"X-CSRF-Token": ""},
        {"Origin": "https://untrusted.invalid"},
        {"Sec-Fetch-Site": "cross-site"},
    ]:
        assert a.post("/api/v1/me/consents", json=payload, headers=headers).status_code == 403
    assert (
        a.post("/api/v1/me/consents", json={**payload, "user_id": "demo-user-b"}).status_code == 422
    )
    assert (
        a.post("/api/v1/me/consents", json={**payload, "case_id": "syn-case-02"}).status_code == 404
    )
    assert a.get("/api/v1/me/consents").json() == []


def test_login_and_invitation_limits_are_durable(demo: DemoHarness) -> None:
    client = demo.anonymous()
    client.headers["X-CSRF-Token"] = client.get("/api/v1/auth/csrf").json()["csrf_token"]
    for _ in range(demo.config.login_limit):
        assert (
            client.post(
                "/api/v1/auth/login", json={"username": "demo-a", "password": "wrong-demo"}
            ).status_code
            == 401
        )
    assert (
        client.post(
            "/api/v1/auth/login", json={"username": "demo-a", "password": "demo-a-only"}
        ).status_code
        == 429
    )
    with Session(demo.engine) as db, db.begin():
        for bucket in db.scalars(select(RateBucket)).all():
            bucket.window_start = now() - timedelta(minutes=2)
    a = demo.login("demo-a")
    for _ in range(demo.config.invitation_limit):
        assert (
            a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).status_code == 200
        )
    assert a.post("/api/v1/invitations", json={"recipient_username": "demo-b"}).status_code == 429


def test_both_processing_and_assessment_are_required(demo: DemoHarness) -> None:
    a, b, joint = demo.pair()
    assert demo.decide(a, "assessment", joint=joint).status_code == 200
    assert demo.decide(b, "assessment", joint=joint).status_code == 200
    assert a.get(f"/api/v1/joints/{joint}/status").json()["status"] == "unavailable"
    assert demo.decide(a, "processing", case="syn-case-01").status_code == 200
    assert a.get(f"/api/v1/joints/{joint}/status").json()["status"] == "unavailable"
    assert demo.decide(b, "processing", case="syn-case-02").status_code == 200
    assert a.get(f"/api/v1/joints/{joint}/status").json()["status"] == "available_for_demo_review"


def test_assessment_never_implies_disclosure_and_exact_output_scope_required(
    demo: DemoHarness,
) -> None:
    a, b, joint, _ = demo.assessment_ready()
    assert a.get(f"/api/v1/joints/{joint}/output").status_code == 403
    assert demo.decide(a, "disclosure", joint=joint).status_code == 409
    with Session(demo.engine) as db, db.begin():
        record = db.get(JointReview, joint)
        assert record is not None
        record.placeholder_reviewed = True
    assert demo.decide(a, "disclosure", joint=joint, target=2).status_code == 409
    assert demo.decide(a, "disclosure", joint=joint).status_code == 200
    assert a.get(f"/api/v1/joints/{joint}/output").status_code == 403
    assert demo.decide(b, "disclosure", joint=joint).status_code == 200
    response = b.get(f"/api/v1/joints/{joint}/output")
    assert response.status_code == 200 and response.json()["kind"] == "non_clinical_placeholder"
    assert "No genetic finding" in response.json()["message"]


def test_withdrawal_blocks_future_dependent_access(demo: DemoHarness) -> None:
    a, b, joint, consent = demo.disclosure_ready()
    assert a.get(f"/api/v1/joints/{joint}/output").status_code == 200
    withdrawal = b.post(
        f"/api/v1/me/consents/{consent['id']}/withdraw",
        json={"expected_version": consent["version"], "idempotency_key": str(uuid4())},
    )
    assert withdrawal.status_code == 200 and withdrawal.json()["state"] == "withdrawn"
    for client in (a, b):
        assert client.get(f"/api/v1/joints/{joint}/output").status_code == 403
        status = client.get(f"/api/v1/joints/{joint}/status").json()
        assert status["status"] == "unavailable" and "reason" not in status


def test_refusal_and_withdrawal_hide_partner_state(demo: DemoHarness) -> None:
    a, b, joint = demo.pair()
    refused = demo.decide(b, "assessment", joint=joint, decision="refuse")
    before = a.get(f"/api/v1/joints/{joint}/status").json()
    assert refused.status_code == 200
    changed = demo.decide(
        b, "assessment", joint=joint, decision="withdraw", version=refused.json()["version"]
    )
    assert changed.status_code == 200
    assert a.get(f"/api/v1/joints/{joint}/status").json() == before
    assert refused.json()["id"] not in json.dumps(a.get("/api/v1/me/consents").json())
    assert "consent_refused" not in json.dumps(a.get("/api/v1/me/audit").json())


def test_version_conflict_idempotent_repeat_and_expiry(demo: DemoHarness) -> None:
    a = demo.login("demo-a")
    key = str(uuid4())
    first = demo.decide(a, "processing", case="syn-case-01", key=key)
    repeat = demo.decide(a, "processing", case="syn-case-01", key=key)
    assert first.status_code == repeat.status_code == 200
    assert repeat.json()["replayed"] and repeat.json()["version"] == 1
    assert (
        demo.decide(a, "processing", case="syn-case-01", key=key, decision="refuse").status_code
        == 409
    )
    assert (
        demo.decide(a, "processing", case="syn-case-01", decision="refuse", version=0).status_code
        == 409
    )
    with Session(demo.engine) as db, db.begin():
        consent = db.get(Consent, first.json()["id"])
        assert consent is not None
        consent.expires_at = now() - timedelta(seconds=1)
    latest = a.get("/api/v1/me/consents").json()[0]
    assert latest["state"] == "expired" and latest["version"] == 2
    with Session(demo.engine) as db:
        expiry_event = db.scalar(select(AuditEvent).where(AuditEvent.action == "consent_expired"))
        assert expiry_event is not None and expiry_event.actor_id is None
    assert demo.decide(a, "processing", case="syn-case-01", version=1).status_code == 409
    assert demo.decide(a, "processing", case="syn-case-01", version=2).json()["version"] == 3


def test_superseded_input_and_permissions_cannot_be_reused(demo: DemoHarness) -> None:
    a, b, joint, _ = demo.disclosure_ready()
    assert (
        b.post(
            "/api/v1/private/cases/syn-case-01/demo-version", json={"expected_version": 1}
        ).status_code
        == 404
    )
    response = a.post(
        "/api/v1/private/cases/syn-case-01/demo-version", json={"expected_version": 1}
    )
    assert response.status_code == 200 and response.json()["input_version"] == 2
    assert all(row["state"] == "superseded" for row in a.get("/api/v1/me/consents").json())
    with Session(demo.engine) as db:
        system_events = db.scalars(
            select(AuditEvent).where(AuditEvent.action == "consent_superseded")
        ).all()
        assert system_events and all(event.actor_id is None for event in system_events)
    assert a.get(f"/api/v1/joints/{joint}/output").status_code == 403
    assert demo.decide(a, "assessment", joint=joint, target=1).status_code == 409


@pytest.mark.parametrize(
    "statement",
    [
        "UPDATE p03_audit SET decision='tampered'",
        "DELETE FROM p03_audit",
        "TRUNCATE p03_audit",
        "UPDATE p03_consent_events SET state='tampered'",
    ],
)
def test_history_is_append_only_in_postgres(demo: DemoHarness, statement: str) -> None:
    a = demo.login("demo-a")
    assert demo.decide(a, "processing", case="syn-case-01").status_code == 200
    with pytest.raises(DBAPIError), demo.engine.begin() as connection:
        connection.execute(text(statement))


def test_real_audit_insert_failure_rolls_back_sensitive_mutation(demo: DemoHarness) -> None:
    a = demo.login("demo-a")
    with demo.engine.begin() as connection:
        connection.execute(
            text(
                "CREATE FUNCTION test_audit_failure() RETURNS trigger AS $$ "
                "BEGIN RAISE EXCEPTION 'injected demo audit fault'; END; $$ LANGUAGE plpgsql"
            )
        )
        connection.execute(
            text(
                "CREATE TRIGGER test_audit_failure BEFORE INSERT ON p03_audit "
                "FOR EACH ROW EXECUTE FUNCTION test_audit_failure()"
            )
        )
    try:
        response = demo.decide(a, "processing", case="syn-case-01")
        assert response.status_code == 503
        assert "injected" not in response.text
        with Session(demo.engine) as db:
            assert db.scalar(select(func.count()).select_from(Consent)) == 0
            assert db.scalar(select(func.count()).select_from(ConsentEvent)) == 0
    finally:
        with demo.engine.begin() as connection:
            connection.execute(text("DROP TRIGGER test_audit_failure ON p03_audit"))
            connection.execute(text("DROP FUNCTION test_audit_failure()"))
    assert demo.decide(a, "processing", case="syn-case-01").status_code == 200


def wait_for_lock_waiters(engine: Engine, count: int) -> None:
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        with engine.connect() as connection:
            waiting = connection.scalar(
                text(
                    "SELECT count(*) FROM pg_locks WHERE locktype='advisory' "
                    "AND objid=:key AND NOT granted AND database="
                    "(SELECT oid FROM pg_database WHERE datname=current_database())"
                ),
                {"key": GATE_KEY},
            )
        if waiting >= count:
            return
        time.sleep(0.02)
    pytest.fail("Expected actual concurrent PostgreSQL advisory-lock waiters were not observed")


@pytest.mark.parametrize("withdraw_first", [True, False])
def test_concurrent_withdrawal_and_disclosure_are_totally_ordered(
    demo: DemoHarness, withdraw_first: bool
) -> None:
    a, b, joint, consent = demo.disclosure_ready()

    def withdraw():
        return b.post(
            f"/api/v1/me/consents/{consent['id']}/withdraw",
            json={"expected_version": consent["version"], "idempotency_key": str(uuid4())},
        )

    def read():
        return a.get(f"/api/v1/joints/{joint}/output")

    with ThreadPoolExecutor(max_workers=2) as pool:
        with demo.engine.begin() as blocker:
            blocker.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": GATE_KEY})
            first = pool.submit(withdraw if withdraw_first else read)
            wait_for_lock_waiters(demo.engine, 1)
            second = pool.submit(read if withdraw_first else withdraw)
            wait_for_lock_waiters(demo.engine, 2)
        first_response, second_response = first.result(timeout=10), second.result(timeout=10)
    if withdraw_first:
        assert first_response.status_code == 200 and second_response.status_code == 403
    else:
        assert first_response.status_code == second_response.status_code == 200
    assert a.get(f"/api/v1/joints/{joint}/output").status_code == 403


def test_errors_audit_and_general_logs_exclude_sensitive_fields(
    demo: DemoHarness, caplog: pytest.LogCaptureFixture
) -> None:
    import logging

    client = demo.anonymous()
    client.headers["X-CSRF-Token"] = client.get("/api/v1/auth/csrf").json()["csrf_token"]
    marker = "fictional-private-password-marker"
    with caplog.at_level(logging.INFO, logger="amanah.requests"):
        response = client.post(
            "/api/v1/auth/login", json={"username": "demo-a", "password": marker}
        )
    assert response.status_code == 401 and marker not in response.text
    messages = " ".join(
        record.getMessage() for record in caplog.records if record.name == "amanah.requests"
    )
    assert marker not in messages and "csrf_token" not in messages and "password" not in messages
    a = demo.login("demo-a")
    rows = a.get("/api/v1/me/audit").json()
    assert rows and all(
        set(row) == {"id", "action", "purpose", "resource_id", "decision", "version", "created_at"}
        for row in rows
    )
    with Session(demo.engine) as db:
        events = db.scalars(select(AuditEvent)).all()
        assert all(marker not in event.action + event.purpose + event.decision for event in events)
