"""Read-only smoke checks of the explicitly fictional local stack."""

import json
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def get(url: str, headers: dict[str, str] | None = None) -> tuple[int, dict[str, object]]:
    try:
        with urlopen(Request(url, headers=headers or {}), timeout=10) as response:
            return response.status, json.load(response)
    except HTTPError as response:
        return response.code, json.load(response)


def main() -> None:
    api = os.environ.get("API_TEST_URL", "http://127.0.0.1:18000")
    web = os.environ.get("PLAYWRIGHT_BASE_URL", "http://127.0.0.1:13000")
    for endpoint in ("/health/live", "/health/ready"):
        status, body = get(api + endpoint)
        assert status == 200 and body["demo_only"] is True, endpoint
    status, body = get(api + "/api/v1/demo/cases")
    assert status == 200 and body["demo_only"] is True
    assert [row["id"] for row in body["cases"]] == ["syn-case-01", "syn-case-02"]  # type: ignore[union-attr,index]
    status, body = get(web + "/api/demo")
    assert status == 200 and body["database"] == "ready"
    assert len(body["cases"]) == 2  # type: ignore[arg-type]
    status, body = get(api + "/api/v1/knowledge")
    assert status == 200 and body["status"] == "unavailable" and body["sources"] == []
    for case_id in ("syn-case-01", "invented-other-person"):
        status, body = get(
            api + "/api/v1/private/cases/" + case_id,
            {"Authorization": "Bearer fictional-admin", "X-Role": "admin"},
        )
        assert status == 401
        assert body["error"]["code"] == "AUTHENTICATION_REQUIRED"  # type: ignore[index]
    print(
        "PASS: live/ready, 2 PostgreSQL fixtures, frontend->API->database, "
        "empty knowledge, 2 protected denials"
    )


if __name__ == "__main__":
    main()
