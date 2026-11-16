# Local hackathon development

P04 (DEC-011) adds fixture-only report management in `/workspace`; see [schema](report-schema.md), [API](p04-api.md), [validation](report-validation.md), [ADR-007](adr/ADR-007-synthetic-report-storage.md). Startup applies additive `0003_reports` after preserved `0001_demo`/`0002_identity`, never resetting P03 rows. Grant own current processing, select/import a fictional fixture, regrant processing for the changed input, inspect coverage/source fields, apply A's correction, regrant and compare revisions. Persisted input changes intentionally supersede old processing/joint/output permissions. No raw partner/professional/support report access, upload, report RAG/model/clinical calculation or deployment.

## Isolated P04 browser verification

Use a fresh disposable project so predefined initial/correction revisions do not alter normal demo history:

```powershell
$env:DB_PORT='25432'
$env:API_PORT='28000'
$env:WEB_PORT='23000'
docker compose -p amanah-p04-verify up --build -d --wait --wait-timeout 180
$env:PLAYWRIGHT_CHANNEL='msedge'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:23000'
$env:API_TEST_URL='http://127.0.0.1:28000'
npm run test:e2e
```

CI uses clean Chromium/default ports. Set API_TEST_URL with alternate API ports because the preserved foundation test calls FastAPI directly. Each full P04 E2E needs a fresh disposable volume. Before reset, verify `docker volume inspect amanah-p04-verify_demo-data` labels identify only `amanah-p04-verify`; `docker compose -p amanah-p04-verify down --volumes` then removes only this expressly disposable test project. Never reset `amanah-hackathon` or real data. Pytest separately uses `_test` PostgreSQL. Clear task port/browser overrides or open a new terminal before normal localhost:13000 startup.

No new runtime library/model key. `.gitattributes` preserves LF fixture bytes on Windows/Linux; don't regenerate hashes to hide source changes. Original JSON/parsed content/prior provenance are immutable in PostgreSQL. Twenty report attempts/actor/minute; no purge or approved retention period. Public credentials/HTTP/DB-owner privileges remain local-demo limits.

Synthetic-only P02/P03 under DEC-009/DEC-010. Clinical gates remain BLOCKED. See [ADR-006](adr/ADR-006-demo-identity-consent.md) and [P03 API](p03-api.md).

## One-command Docker startup

Start Docker Desktop/Engine in Linux-container mode. From repository root run `docker compose up --build -d --wait --wait-timeout 180`. The web/API/database publish to 127.0.0.1 ports 13000/18000/15432. Compose defaults are public development placeholders, not real secrets. `.env.example` lists optional port/database settings; local `.env` files are ignored. Do not use external hosting or sensitive data.

API startup runs Alembic then the idempotent fictional seed before serving. Readiness requires the expected migration and at least one fixture. Web health checks the web process; `scripts/smoke_stack.py` verifies the complete frontend/API/database path and protected denials. `docker compose down` stops this project's services and preserves its synthetic volume. It does not stop unrelated projects.

## Native API and frontend

Python 3.10+ (local verified 3.10.11; container/CI 3.12) and Node 22.13+ (local 22.19.0) are supported by this scaffold. Docker database can be used independently:

```powershell
docker compose up db -d --wait
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/api/requirements.lock
$env:PYTHONPATH = 'services/api/src'
.\.venv\Scripts\python.exe -m alembic -c services/api/alembic.ini upgrade head
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m app.seed_identity
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 18000 --no-access-log
```

In a second terminal run `npm ci` then `npm run dev`; browse localhost:13000. Do not run native and Compose API/web on the same ports simultaneously. `API_INTERNAL_URL` is server-only and defaults to localhost:18000; Compose sets api:8000. No backend URL or database credential is exported as a public frontend environment variable.

API environment names: `AMANAH_DATABASE_URL`, `AMANAH_DEMO_ONLY`. Only demonstration mode is supported; explicitly setting demo mode false fails startup. This setting cannot prove that arbitrary user content is synthetic, which is why there are no data-entry/upload/mutation endpoints for clinical data.

## Disposable PostgreSQL verification

Migration integration tests refuse a database name that does not end in `_test`. Use a dedicated fictional test database, never the running demo database or any real data:

```powershell
docker compose exec -T db psql -U amanah_demo -d postgres -c 'CREATE DATABASE amanah_demo_test;'
$env:TEST_DATABASE_URL = 'postgresql+psycopg://amanah_demo:demo-local-only@127.0.0.1:15432/amanah_demo_test'
.\.venv\Scripts\python.exe -m pytest -c services/api/pyproject.toml services/api/tests
```

Create the test database once; skip the creation command when it already exists. Tests reset only the dedicated `_test` database through downgrade/upgrade and fictional seeds, and exercise actual identity, consent, audit and PostgreSQL locking. `0001_demo` is preserved; additive `0002_identity` creates local account/session/ownership/assignment/invitation/consent/joint/audit/rate tables. Both seeds are idempotent; existing choices are not reset. CI requires TEST_DATABASE_URL; absent local database tests are skips, not evidence of a passing gate.

## Browser and accessibility checks

With the Compose stack healthy, `npm run test:e2e` uses Playwright Chromium. Install its browser with `npx playwright install chromium` from apps/web if needed. On this Windows workstation an installed Edge can be used with `$env:PLAYWRIGHT_CHANNEL='msedge'`; no browser profile/account is used. CI installs a clean Chromium. Tests save fictional desktop/mobile screenshots under ignored `apps/web/test-results`.

The web foundation uses semantic regions/headings, a keyboard skip link, visible focus, labelled status changes, responsive reflow and reduced-motion preference. Axe checks are one engineering signal; they are not a full accessibility/bilingual/clinical comprehension audit. No Arabic clinical copy is approved or generated.

## Troubleshooting and retention

Readiness 503 means unavailable/missing migration/seed; liveness may still be 200. No raw exception, SQL, token, URL query or request body appears in API error messages or request logs. Log fields are method/status/duration/request ID only; Uvicorn access logging is disabled by the provided startup commands. Check `docker compose ps` and minimal local logs without inserting real data.

Missing RAG is expected: unavailable with no sources. P03 permits only valid fictional sessions with the necessary relationships and current scoped choices. No administrator bypass. Workspace public credentials cover A/B/counsellor/support; use separate browser contexts for A/B and manually copy recipient-bound invitation codes. No real notification or enrollment. Processing permission also allows assigned fictional counsellor synthetic metadata access, explained in the UI; it never grants joint assessment/disclosure. Logout/expiry clears private UI state.

Optional API names: AMANAH_WEB_ORIGIN, AMANAH_COOKIE_SECURE, AMANAH_SESSION_TTL_SECONDS, AMANAH_INVITATION_TTL_SECONDS, AMANAH_CONSENT_TTL_SECONDS, AMANAH_LOGIN_LIMIT, AMANAH_INVITATION_LIMIT, AMANAH_RATE_WINDOW_SECONDS. Web DEMO_WEB_ORIGIN must match; Compose derives it from WEB_PORT. Secure=false for HTTP loopback, true for HTTPS loopback; external origins fail configuration. Sessions/permissions 30 minutes, challenges five, invitations ten are demo timeouts, not approved retention. Expired rows remain stored; no purge schedule. Five login attempts/account and invitations/sender per minute plus shared 30/IP login/challenge ceiling can yield 429; wait the 60-second window. Forwarded IP headers are not trusted.

Authenticated browser traces are off; screenshots mask invitation fields. Public credentials, HTTP loopback and database-owner privileges are unsuitable for external hosting. No clinical data input/output or P04. Future professional permissions, retention, hosting and regulatory decisions remain unresolved.
