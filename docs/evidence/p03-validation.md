# P03 verification evidence

2026-11-15, Asia/Calcutta. Synthetic Demo — Not for Clinical Use. Engineering verification IN PROGRESS pending exact implementation CI and final delivery. Clinical-production governance stays BLOCKED; APR-01–APR-08 PENDING, H01–H12 OPEN.

Authorization, exact stacked P02 parent and initial green CI: [preflight](p03-preflight.md). Implementation decisions: [ADR-006](../adr/ADR-006-demo-identity-consent.md). Only P03 is authorized; no merge/P04.

## Local checks observed so far

`pytest -c services/api/pyproject.toml services/api/tests -x -q -o faulthandler_timeout=40` with TEST_DATABASE_URL pointing to dedicated local PostgreSQL 17 `amanah_demo_test`: **45 passed, zero skipped, one upstream Starlette/httpx deprecation warning, 94.37 seconds**. Includes P02 regression and real P03 transactions/permission races/audit failure. `.venv` Python 3.10.11; container/CI Python 3.12. No real data. Argon2/typed schemas, Ruff lint/format and strict mypy: passed (21 source files).

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: exit 0; **18 Vitest tests / three files passed**; Next production build generated foundation, workspace and proxy routes. `npm audit --audit-level=moderate`: **found 0 vulnerabilities**. `python -m unittest discover -s tests`: **four tests OK**. Locks include Argon2id dependency; no new frontend dependencies.

`docker compose up --build -d --wait --wait-timeout 180`: exit 0, web/API/PostgreSQL healthy on loopback 13000/18000/15432. Preserved P02 migration/templates, applied `0002_identity`, provisioned four fictional local accounts idempotently. `python scripts/smoke_stack.py`: **PASS: live/ready, 2 PostgreSQL fixtures, frontend->API->database, empty knowledge, 2 protected denials**.

Playwright through actual Compose using Windows Edge: first run **four passed, one failed, three did not run**, five-second sign-in assertion timed out while UI still signing in during concurrent cold startup. Full rerun **eight passed in 19.2 seconds**, including both independent identities/invite/assessment/withdrawal, professional/support denials, CSRF/logout, mobile axe and preserved foundation. Attempted root npm `--workers=1` was not forwarded (output still five workers); it is not evidence of serial execution. Configuration now explicitly bounds workers to two, test timeout 60 seconds, assertion 10 seconds; final rerun will be recorded below. A separate sanitized local proxy probe observed challenge 200/0.01s, login 200/0.12s, owned cases 200/0.02s. No response secrets were printed.

## Failure history and corrections

Initial database test found alternate case identifiers returned schema 422 instead of authenticated-domain denial. Bounded identifier validation was widened while server authorization stays mandatory; full regression passed. Strict type checks required explicit role typing; fixed. Review corrected automatic expiry/supersession audit actor to null/system so it cannot falsely impersonate a participant or expose partner transition identifiers in own history; focused assertions added. Browser joint selection now uses the accepted invitation response UUID, avoiding ambiguous persistent prior joints. No test was disabled to obtain a passing result.

## Security and review limits

Review covered session rotation/hash/revocation, HttpOnly/SameSite/Secure configuration, CSRF/origin, ownership/assignment/current purpose/version, neutral partner state, append-only transactional evidence and log minimization. Same demo-wide PostgreSQL lock covers authorization reads/withdrawal/audit; two real concurrent waiter orderings test the contract. DB trigger-injected audit INSERT failure must roll back both consent and its event. UPDATE/DELETE/TRUNCATE history rejection is tested, but DB owner can alter/drop triggers. Public credentials, HTTP loopback, shared rate ceiling, no MFA/recovery/account lifecycle, no automatic row purge and global serialization prohibit treating this as a production identity system. No outside security/clinical/legal review is claimed.

Disclosure positive tests set a fixed non-clinical reviewed-placeholder flag only in the disposable test database. Normal runtime cannot review/generate outputs. No genetic findings/probabilities, RAG/model calls, uploads, medical guidance, real professionals/appointments or integrations. P01 professional permissions/hosting/retention/classification remain unresolved. Automated axe/mobile/keyboard checks do not certify accessibility, Arabic/RTL or low-literacy understanding. APR/H records remain unchanged.

## Exact implementation and delivery

PENDING implementation SHA, exact GitHub Actions result, final staged secret/document checks and handoff. A later documentation-only handoff commit will cite the immutable implementation snapshot; its own final SHA is reported separately to avoid self-reference.
