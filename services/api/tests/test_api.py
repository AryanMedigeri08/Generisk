import logging

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine

from app.config import Settings
from app.main import create_app
from app.modules.clinical_rules import UnavailableClinicalRules
from app.modules.consent import DenyAllConsent
from app.modules.identity import Principal, UnavailableAuthentication


def test_liveness_and_seeded_readiness(client: TestClient) -> None:
    assert client.get("/health/live").json() == {"status": "ok", "demo_only": True}
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["database"] == "ready"


def test_public_demo_contains_only_fictional_foundation_records(client: TestClient) -> None:
    response = client.get("/api/v1/demo/cases")
    assert response.status_code == 200
    body = response.json()
    assert body["demo_only"] is True
    assert [row["id"] for row in body["cases"]] == ["syn-case-01", "syn-case-02"]
    assert all(
        row["is_synthetic"] and row["demo_status"] == "foundation_only" for row in body["cases"]
    )
    assert "Not patient records" in body["disclaimer"]


@pytest.mark.parametrize("locale", ["en", "ar"])
def test_empty_knowledge_is_safe_and_source_free(client: TestClient, locale: str) -> None:
    response = client.get("/api/v1/knowledge", params={"locale": locale})
    assert response.status_code == 200
    assert response.json()["reason"] == "empty_approved_corpus"
    assert response.json()["sources"] == []
    assert "risk" not in response.json()


@pytest.mark.parametrize("authorization", [None, "Bearer invented-token", "Basic admin", "Bearer "])
@pytest.mark.parametrize("case_id", ["syn-case-01", "another-person"])
def test_protected_cases_deny_every_identity_claim(
    client: TestClient, authorization: str | None, case_id: str
) -> None:
    headers = {"X-Role": "admin", "X-Subject": "syn-person-a"}
    if authorization is not None:
        headers["Authorization"] = authorization
    response = client.get(f"/api/v1/private/cases/{case_id}", headers=headers)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_UNAVAILABLE"
    assert "cases" not in response.json()


def test_consent_grants_are_not_implemented(client: TestClient) -> None:
    response = client.post("/api/v1/private/consents", headers={"Authorization": "Bearer invented"})
    assert response.status_code == 401
    assert not DenyAllConsent().allows(Principal("syn-person-a"), "syn-case-01", "grant")
    assert UnavailableAuthentication().authenticate("Bearer invented") is None


def test_error_envelope_does_not_echo_request_values(client: TestClient) -> None:
    marker = "fictional-sensitive-marker"
    response = client.get("/api/v1/knowledge", params={"locale": marker})
    assert response.status_code == 422
    assert marker not in response.text
    assert set(response.json()["error"]) == {"code", "message", "request_id"}
    assert response.headers["X-Request-ID"] == response.json()["error"]["request_id"]


def test_request_logging_omits_urls_headers_and_input(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO, logger="amanah.requests"):
        response = client.get(
            "/api/v1/knowledge?locale=fictional-input-marker",
            headers={"Authorization": "Bearer fictional-header-marker"},
        )
    messages = " ".join(
        record.getMessage() for record in caplog.records if record.name == "amanah.requests"
    )
    assert response.status_code == 422
    assert "fictional-input-marker" not in messages
    assert "fictional-header-marker" not in messages
    assert "/api/" not in messages
    assert "status=422" in messages


def test_database_failure_is_sanitized_but_liveness_survives() -> None:
    engine = create_engine("sqlite+pysqlite://")
    with TestClient(create_app(Settings(database_url="sqlite+pysqlite://"), engine)) as client:
        assert client.get("/health/live").status_code == 200
        response = client.get("/health/ready")
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "DATABASE_UNAVAILABLE"
        response = client.get("/api/v1/demo/cases")
        assert response.status_code == 503
        assert "SELECT" not in response.text
        assert "sqlite" not in response.text


def test_real_mode_configuration_is_rejected() -> None:
    with pytest.raises(ValidationError, match="Only synthetic"):
        Settings(demo_only=False)


def test_capabilities_never_claim_future_features(client: TestClient) -> None:
    capabilities = client.get("/api/v1/capabilities").json()
    assert capabilities["authentication"] is False
    assert capabilities["consent_grants"] is False
    assert capabilities["approved_knowledge"] is False
    assert capabilities["real_integrations"] is False
    assert UnavailableClinicalRules().availability().status == "unavailable"


def test_unknown_route_and_cache_headers(client: TestClient) -> None:
    response = client.get("/not-a-route")
    assert response.status_code == 404
    assert response.json()["error"]["message"] == "Resource unavailable."
    assert response.headers["Cache-Control"] == "no-store"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
