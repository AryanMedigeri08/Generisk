# P04 verification evidence

2026-11-16, Asia/Calcutta. Synthetic-only hackathon P04 under DEC-011. **Hackathon engineering PASS**, exact implementation CI observed. Human handoff acceptance PENDING. Clinical-production BLOCKED; APR-01–APR-08 PENDING, H01–H12 OPEN. Authorization/ref/CI preflight: [baseline record](p04-preflight.md).

## Implemented boundary

Thirteen packaged fictional fixtures and typed bounded contract, deterministic structural validation, original JSON TEXT plus validated JSONB/provenance, immutable revisions/outcomes and constrained active head, owner/current-processing reports, P03 atomic input/joint/output invalidation and focused `/workspace` report management. No upload, external source, unrestricted download, real health data, professional-report purpose, model/clinical interpretation, RAG/embedding or P05. [ADR-007](../adr/ADR-007-synthetic-report-storage.md), [schema](../report-schema.md), [API](../p04-api.md).

## Actual local results

Windows PowerShell, Python 3.10.11, Node 22.19.0, Docker 29.1.3/Compose 2.40.3-desktop.1, PostgreSQL17, container Python3.12; no new runtime dependency. Docker initially stopped; started installed Desktop. Baseline exact P03 CI verified green before branching; no merge/default-branch/history change.

`pytest -c services/api/pyproject.toml services/api/tests/test_p04_validation.py services/api/tests/test_p04_postgres.py -x -q -o faulthandler_timeout=40`: **58 passed, one upstream Starlette/httpx deprecation warning, 62.78s** against actual disposable PostgreSQL. Subsequent full `pytest -c services/api/pyproject.toml services/api/tests -x -q -o faulthandler_timeout=40`: **103 passed, zero skips, one warning, 92.72s**. After adding exact original JSON preservation/digest regression, full rerun: **103 passed, zero skips, one warning, 96.81s**. Dedicated TEST_DATABASE_URL ends `_test`; integration fixture downgrades/re-upgrades that database only. Later duplicate-old-source-after-correction assertion: **one passed, 32 deselected, 13.66s**; deselected cases are not passes.

Ruff lint/format passed after formatting generated migration/SQL literals; strict mypy **27 source files passed**. Initial checks caught a literal-default typing mismatch and long SQL lines; corrected before verification. `alembic upgrade head` applied `0003_reports`; `alembic check`: **No new upgrade operations detected**. Source-preservation TEXT was added to the unreleased migration before pushing; two empty local development/verification revision tables were brought into alignment with ADD COLUMN. Full disposable migration/re-upgrade tests independently ran the final migration, preserving P03 users/sessions/consent/audit counts.

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: exit 0; **23 frontend tests / four files passed**, Next production build successful. No new frontend dependency. Report tests cover current processing/no file input, scoped fixture/CSRF/version/idempotency body, explicit coverage/provenance, cleared withdrawn state, correction and unsupported response.

Built separate `amanah-p04-verify` Compose on loopback web23000/API28000/db25432. Normal `amanah-hackathon` volume/P03 history was preserved. `docker compose -p amanah-p04-verify up --build -d --wait --wait-timeout 180`: exit 0, all three services healthy. Initial browser command set alternate web but omitted API_TEST_URL: preserved foundation direct-API test failed ECONNREFUSED18000. P04 workflow reached complete import/correction/partner denial but failed mobile overflow assertion; seven tests passed, two failed. Geometry-only diagnosis identified one SELECT extending to x406 at width375. Fixed explicit logical select/label sizing and set API_TEST_URL28000. No assertions skipped/weakened.

Verified disposable volume's Compose project label, reset only `amanah-p04-verify` with `down --volumes`, rebuilt and reran all browser tests. `PLAYWRIGHT_CHANNEL=msedge`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:23000`, `API_TEST_URL=http://127.0.0.1:28000`, `npm run test:e2e`: **nine passed, one worker, 37.2s**, zero skips. Includes P02 foundation, independent P03 invitation/consent/withdrawal, P04 unsupported/review/accepted input, explicit exclusions/source hashes, original vs correction, independent joint availability invalidation, partner raw-report denial, no report IDs/query selectors in report URLs, no localStorage, keyboard selection, authenticated mobile axe A/AA and no horizontal overflow. Authenticated traces off; report-only screenshots exclude invitation/session secrets.

## Integrity and review limits

Fixture bytes are LF-pinned by a scoped `.gitattributes` rule, preserving existing newline policy. Manifest source hashes checked before parsing, not recalculated to hide failures. P04 reuses P03 transaction gate; tests cover real lock waiters in both correction/withdrawal orders and actual audit INSERT failure rollback of revisions/head/outcomes/input/permissions. DB constraints/triggers protect source/history/head, but DB owner can alter them. Public credentials, HTTP loopback, global lock/shared limits, no cleanup/MFA/production identity lifecycle, finite synthetic samples and no professional report purpose remain real-service gaps. No independent clinical/legal/security/accessibility/FHIR conformance approval.

No report goes to KnowledgeProvider, pgvector, embeddings, a model, arbitrary external URL or clinical rules. Empty knowledge/unavailable rules regressions remain. FHIR primary R4 concept mapping is documented in schema, without formal resource/profile conformance. Historical approval/hazard records remain unchanged.

## Exact implementation, CI and delivery

Pushed implementation **`721d82e79117a91299602d855b55c86385742c6a`** on `feature/p04-synthetic-report-ingestion`, parent authorization checkpoint `80459a026a30fe25be47a684b864b17ba3fca025`, stacked directly on reviewed unmerged P03 `5cde32ff56d5243ab29b9a05b7a8fc6dfdebfc3d`. No merge, force push, default-branch change or P05 implementation.

[Run 43859739332](https://github.com/AryanMedigeri08/Generisk/actions/runs/43859739332): **completed/success** at that exact SHA; **web, api, compose-smoke all success**, observed using GitHub API/connector. Job logs confirm **103 PostgreSQL-inclusive backend tests passed/one warning/34.91s**, strict mypy **27 sources**, Ruff **40 files formatted**, **23 frontend tests/four files**, **nine Chromium browser tests/14.0s**, smoke PASS, npm zero vulnerabilities, **159 tracked text files/zero secret findings**. These are actual runtime checks, not a documentation-only claim. Earlier preflight-only run 43854733035 also passed but does not substitute for implementation evidence.

Local advisory checks: `npm audit --audit-level=moderate` found **zero vulnerabilities**; `python -m pip check` **no broken requirements**; four `python -m unittest discover -s tests` scanner tests **OK**. Isolated ignored pip-audit tool, `$env:PYTHONPATH='artifacts/local/pip-audit'; .\.venv\Scripts\python.exe -m pip_audit --no-deps --disable-pip -r services/api/requirements.lock`: **No known vulnerabilities found**, exit 0; warns that full package hashes are absent. No runtime/lockfile changed for the scan.

Normal `docker compose up --build -d --wait --wait-timeout 180` updated localhost13000/18000/15432 services: all healthy, preserved original volume/P03 data; `python scripts/smoke_stack.py`: **PASS: live/ready, 2 PostgreSQL fixtures, frontend->API->database, empty knowledge, 2 protected denials**. [Desktop](p04-report-desktop.png) and [mobile](p04-report-mobile.png) report-only screenshots were visually inspected. Original values/provenance and explicit superseded/current/review states are legible; no real data or auth/invitation secrets included.

[Changed-file inventory](p04-files-changed.txt) records all paths relative to the exact reviewed P03 baseline, including final evidence. [P04-to-P05](../../handoffs/P04-to-P05.md) is a review handoff; human acceptance and separately bounded P05 authorization remain pending. A final documentation-only commit adds inventory/handoff/screenshots/evidence/milestone updates, without changing runtime since the green implementation. Its final SHA/run are reported separately after pushing to avoid self-reference.

Final staged document/secret checks are recorded below. They do not constitute clinical/legal or application assurance.

`python scripts/check_secrets.py`: **161 tracked text files, zero findings**, exit 0; two new PNGs are binary. `python scripts/validate_p00.py`: **nine documents, twelve hazards/eight approvals, 208 assertions passed/zero failed**, exit 0. Its earlier intermediate failure was the README link to the not-yet-written P04 handoff; creating/completing the handoff resolved it. The P00 validator measures document integrity only and does not unblock clinical governance.

A read-only Python here-string piped to `python -` enumerated tracked Markdown, checked balanced fences/local targets/anchors and ten handoff sections/separate gates, canonical APR/H rows and unchanged governance files, post-CI change scope, manifest digest equality for actual disk bytes AND `git show :path` index bytes, and complete `git diff --name-status` inventory. Actual output, exit 0:

```text
PASS: 53 Markdown files; 266 local links/anchors; balanced fences; 10 handoff sections
PASS: hackathon PASS / clinical BLOCKED; 8 APR PENDING / 12 H OPEN; canonical registries unchanged
PASS: 13 fixture hashes match disk and Git index; LF preserved
PASS: 59 paths in file inventory; 7 documentation/screenshots-only delivery paths
```

`npm run format:check`, `git diff --cached --check`, `docker compose config --quiet`: exit 0. No executable change since exact green implementation snapshot. All twelve user P04 engineering criteria have observed implementation/negative/migration/browser/CI evidence and the complete review handoff. Human acceptance and P05 authorization remain pending; clinical-production remains BLOCKED. Final delivery SHA and its independently observed CI run are reported after push without recursive self-referential commits.
