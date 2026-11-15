# Local hackathon development

Synthetic-only, non-clinical P02 foundation under DEC-009. No real data, real provider connectivity or clinical readiness. Clinical gates remain BLOCKED; P03 is not implemented.

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

Create the test database once; skip the creation command when it already exists. Tests upgrade, seed twice, read through FastAPI/PostgreSQL, verify the synthetic flag constraint, downgrade (dropping only that disposable fixture table), re-upgrade and reseed. Migration `0001_demo` adds only demonstration fields, no health/genomic schema. Seeding CLI is `python -m app.seed` with PYTHONPATH set as above.

## Browser and accessibility checks

With the Compose stack healthy, `npm run test:e2e` uses Playwright Chromium. Install its browser with `npx playwright install chromium` from apps/web if needed. On this Windows workstation an installed Edge can be used with `$env:PLAYWRIGHT_CHANNEL='msedge'`; no browser profile/account is used. CI installs a clean Chromium. Tests save fictional desktop/mobile screenshots under ignored `apps/web/test-results`.

The web foundation uses semantic regions/headings, a keyboard skip link, visible focus, labelled status changes, responsive reflow and reduced-motion preference. Axe checks are one engineering signal; they are not a full accessibility/bilingual/clinical comprehension audit. No Arabic clinical copy is approved or generated.

## Troubleshooting and retention

Readiness 503 means unavailable/missing migration/seed; liveness may still be 200. No raw exception, SQL, token, URL query or request body appears in API error messages or request logs. Log fields are method/status/duration/request ID only; Uvicorn access logging is disabled by the provided startup commands. Check `docker compose ps` and minimal local logs without inserting real data.

Missing RAG is expected: the provider returns unavailable with no sources. Protected routes always deny; fabricated tokens and role headers cannot enable them. There is no auth bypass configuration. Do not fix a protected denial by adding a development token. P03 requires review and separate authorization. No real-data retention, hosting or regulator requirement is decided by this local setup.
