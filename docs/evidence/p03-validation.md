# P03 verification evidence

2026-11-15, Asia/Calcutta. Synthetic Demo — Not for Clinical Use. **P03 hackathon engineering PASS**, exact implementation CI observed. Human handoff acceptance PENDING. Clinical-production governance stays BLOCKED; APR-01–APR-08 PENDING, H01–H12 OPEN.

Authorization, exact stacked P02 parent and initial green CI: [preflight](p03-preflight.md). Implementation decisions: [ADR-006](../adr/ADR-006-demo-identity-consent.md). Only P03 is authorized; no merge/P04.

## Local checks observed so far

`pytest -c services/api/pyproject.toml services/api/tests -x -q -o faulthandler_timeout=40` with TEST_DATABASE_URL pointing to dedicated local PostgreSQL 17 `amanah_demo_test`: **45 passed, zero skipped, one upstream Starlette/httpx deprecation warning, 94.37 seconds**. Includes P02 regression and real P03 transactions/permission races/audit failure. `.venv` Python 3.10.11; container/CI Python 3.12. No real data. Argon2/typed schemas, Ruff lint/format and strict mypy: passed (21 source files).

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: exit 0; **18 Vitest tests / three files passed**; Next production build generated foundation, workspace and proxy routes. `npm audit --audit-level=moderate`: **found 0 vulnerabilities**. `python -m unittest discover -s tests`: **four tests OK**. Locks include Argon2id dependency; no new frontend dependencies.

`docker compose up --build -d --wait --wait-timeout 180`: exit 0, web/API/PostgreSQL healthy on loopback 13000/18000/15432. Preserved P02 migration/templates, applied `0002_identity`, provisioned four fictional local accounts idempotently. `python scripts/smoke_stack.py`: **PASS: live/ready, 2 PostgreSQL fixtures, frontend->API->database, empty knowledge, 2 protected denials**.

Playwright through actual Compose using Windows Edge: first run **four passed, one failed, three did not run**, five-second sign-in assertion timed out while UI still signing in during concurrent cold startup. Full rerun **eight passed in 19.2 seconds**, including both independent identities/invite/assessment/withdrawal, professional/support denials, CSRF/logout, mobile axe and preserved foundation. Attempted root npm `--workers=1` was not forwarded (output still five workers); it is not evidence of serial execution. Configuration now explicitly bounds workers to two, test timeout 60 seconds, assertion 10 seconds. Final `PLAYWRIGHT_CHANNEL=msedge; npm run test:e2e`: **eight passed, two workers, 20.6 seconds**, no skips. A separate sanitized local proxy probe observed challenge 200/0.01s, login 200/0.12s, owned cases 200/0.02s. No response secrets were printed. [Masked consent workflow](p03-independent-consent.png) and [mobile keyboard sign-in](p03-mobile-signin.png) screenshots were visually inspected; invitation fields are masked.

After system-actor assertions were added, `pytest .../test_p03_postgres.py -k 'version_conflict_idempotent_repeat_and_expiry or superseded_input' -q`: **two passed, 23 deselected, one upstream warning, 5.80 seconds**. Those deselected cases are not counted as passes; full CI subsequently ran all 45 tests. Ruff: all checks passed / 31 files already formatted. `python -m pip check`: **No broken requirements found**.

An isolated advisory tool was installed only into ignored `artifacts/local/pip-audit`, without changing the application lockfile. Actual command: `$env:PYTHONPATH='artifacts/local/pip-audit'; .\.venv\Scripts\python.exe -m pip_audit --no-deps --disable-pip -r services/api/requirements.lock`. Result **No known vulnerabilities found**, exit 0. Warnings recommend full package hashes; the pinned Python lockfile is not hash-verified. No clean advisory result implies a complete supply-chain review.

## Failure history and corrections

Initial database test found alternate case identifiers returned schema 422 instead of authenticated-domain denial. Bounded identifier validation was widened while server authorization stays mandatory; full regression passed. Strict type checks required explicit role typing; fixed. Review corrected automatic expiry/supersession audit actor to null/system so it cannot falsely impersonate a participant or expose partner transition identifiers in own history; focused assertions added. Browser joint selection now uses the accepted invitation response UUID, avoiding ambiguous persistent prior joints. No test was disabled to obtain a passing result.

## Security and review limits

Review covered session rotation/hash/revocation, HttpOnly/SameSite/Secure configuration, CSRF/origin, ownership/assignment/current purpose/version, neutral partner state, append-only transactional evidence and log minimization. Same demo-wide PostgreSQL lock covers authorization reads/withdrawal/audit; two real concurrent waiter orderings test the contract. DB trigger-injected audit INSERT failure must roll back both consent and its event. UPDATE/DELETE/TRUNCATE history rejection is tested, but DB owner can alter/drop triggers. Public credentials, HTTP loopback, shared rate ceiling, no MFA/recovery/account lifecycle, no automatic row purge and global serialization prohibit treating this as a production identity system. No outside security/clinical/legal review is claimed.

Disclosure positive tests set a fixed non-clinical reviewed-placeholder flag only in the disposable test database. Normal runtime cannot review/generate outputs. No genetic findings/probabilities, RAG/model calls, uploads, medical guidance, real professionals/appointments or integrations. P01 professional permissions/hosting/retention/classification remain unresolved. Automated axe/mobile/keyboard checks do not certify accessibility, Arabic/RTL or low-literacy understanding. APR/H records remain unchanged.

## Exact implementation and delivery

Implementation snapshot **`1ed2bf1b9a59f1dcb2ffbac0fe5ab64e48e82e11`**, pushed to `feature/p03-identity-consent`, parent authorization checkpoint `4aeed4f3bb78d576bcf6cee74966dbdd06da778c`, stacked on preserved unmerged P02 `8ced1458cba1bf84deaf2fc4ce00f1d79aa5f70e`.

Authenticated GitHub API observed [run 43719879238](https://github.com/AryanMedigeri08/Generisk/actions/runs/43719879238) **completed / success** at that exact SHA; **api, web and compose-smoke all success**. CI logs independently show **45 API tests passed, one warning, 25.68s**, 31 Python files formatted, strict mypy 21 sources, **eight Chromium browser tests passed in 10.2s**, live full-stack smoke PASS, npm zero vulnerabilities and **123 tracked text files / zero secret findings**. The downloaded log archive was read in memory; SHA-256 `8ed16342bda2f89e9fe32b6fe94718642608b42819c7c3e0ee14a3d66aaa2f14`. Credentials remained in process memory and were never printed/persisted. Earlier authorization-only run 43716018318 also passed, but does not replace implementation evidence.

All ten user engineering criteria now have actual identity, relationship, state-machine, concurrency, audit-failure and frontend/database evidence; [P03-to-P04](../../handoffs/P03-to-P04.md) is a review handoff, not permission to start P04. A documentation-only delivery adds the final evidence, milestone status, handoff and two inspected screenshots; no runtime code changes after the green snapshot. Its final SHA/run are reported separately after pushing to avoid self-referential commits. No merge, force push or default-branch change.

Final staged document/secret verification is recorded below. These are document-integrity checks, not application/clinical assurance.

`python scripts/check_secrets.py` with all intended files staged: **124 tracked text files, zero findings**, exit 0. The two new PNGs are binary. Four scanner regression tests passed separately. This is limited pattern detection, not comprehensive secret/PHI detection.

`python scripts/validate_p00.py`: **nine documents, twelve hazards/eight approvals, 196 assertions passed / zero failed**, exit 0. Earlier intermediate counts 193/193 changed only with README links. P00 remains BLOCKED: its historical validator measures document integrity only.

A read-only Python here-string piped to `python -` enumerated tracked Markdown (`git ls-files '*.md'`), stripped fenced code for link parsing, checked local targets/anchors and balanced fences, verified handoff sections 1–10/separate gates, canonical APR/H rows and `git diff --name-only 1ed2bf1b9a59f1dcb2ffbac0fe5ab64e48e82e11` scope. Actual output, exit 0:

```text
PASS: 44 Markdown files; 211 local links/anchors; balanced fences; 10 handoff sections
PASS: hackathon PASS / clinical BLOCKED; 8 APR PENDING / 12 H OPEN
PASS: 6 delivery paths; documentation/screenshots only since green implementation
```

`docker compose config --quiet` and `git diff --cached --check`: exit 0. Final delivery paths are README, this evidence, hackathon milestones, restricted next-phase review handoff and two masked/inspected screenshots. No executable changes after implementation CI. Final delivery's independent CI result and exact pushed SHA are reported after completion, without repeatedly modifying a self-referential record.
