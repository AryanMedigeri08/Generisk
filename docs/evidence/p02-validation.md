# P02 synthetic hackathon verification evidence

Date: 2026-11-15, Asia/Calcutta. **Hackathon engineering gate: PASS. Clinical-production gate: BLOCKED.** This verifies the local fictional foundation, not clinical safety, regulatory compliance or real-world medical authorization.

## Baselines, scope and immutable snapshot

- Reviewed P01 input: `e70e5a5c8d6374d9a5ebda9c39124ae088bb5898`.
- Normal main merge: `8f900d1dc9cec5ebc0ece9dafad93770e822e741`, parents recorded in [baseline review](p02-baseline-review.md).
- DEC-009 checkpoint: `39f5938d6fbd78c6ddb4d58283d2623d7365f006`.
- Application checkpoint: `891a065a990ea121497ec38467edd0933997d590`.
- Verified implementation snapshot: `bcb03dbe09a004983eb9e518477c57129b9faff6`.
- Branch: `feature/p02-hackathon-foundation`; P02 has not been merged. GitHub default branch was not changed.

The current user explicitly authorized synthetic-only hackathon P02 in “Hackathon Scope Revision and P02 Authorization”. [DEC-009](../DECISIONS.md#dec-009--hackathon-only-scope-revision-and-p02-authorization) and [ENG-01 to ENG-10](../hackathon-roadmap.md) define this independent engineering gate. P00/full clinical P01 BLOCKED; APR-01 through APR-08 PENDING; H01 through H12 OPEN. No sign-off was invented or clinical approval closed.

The final evidence/handoff/README links are a later documentation-only delivery commit. Its own SHA cannot be embedded within this file; discover it with `git log -1 --format=%H -- docs/evidence/p02-validation.md`. The final reply reports that actual SHA, live remote equality and latest CI result.

## Environment and dependency observations

Windows/PowerShell, Git 2.56.0.windows.4, Python 3.10.11, Node 22.19.0, Docker 29.1.3 and Compose v2.40.3-desktop.1. Container/CI API uses Python 3.12; PostgreSQL image major 17; frontend image Node 22. Resolved frontend runtime: Next 16.4.6, React 19.3.1, Tailwind 4.3.5. Complete resolved dependencies are in package-lock.json and services/api/requirements.lock.

Initial Docker daemon query failed because its Linux-engine pipe was absent. The installed Docker Desktop was started hidden and engine readiness rechecked. Existing unrelated containers were not changed; project ports are loopback 13000/18000/15432. No real records, clinical files or secrets were used. Public local password `demo-local-only` is intentionally a placeholder, not a production secret.

## Actual API, database and source-quality commands

Executed from repository root unless a working directory is stated:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/api/requirements.in
.\.venv\Scripts\python.exe -m pip freeze
.\.venv\Scripts\python.exe -m ruff check services/api scripts/check_secrets.py scripts/smoke_stack.py tests
.\.venv\Scripts\python.exe -m ruff format --check services/api scripts/check_secrets.py scripts/smoke_stack.py tests
.\.venv\Scripts\python.exe -m mypy --config-file services/api/pyproject.toml services/api/src
.\.venv\Scripts\python.exe -m unittest discover -s tests
docker compose config --quiet
docker compose up db -d --wait
docker compose exec -T db psql -U amanah_demo -d postgres -v ON_ERROR_STOP=1 -c 'CREATE DATABASE amanah_demo_test;'
$env:TEST_DATABASE_URL = 'postgresql+psycopg://amanah_demo:demo-local-only@127.0.0.1:15432/amanah_demo_test'
.\.venv\Scripts\python.exe -m pytest -c services/api/pyproject.toml services/api/tests -o faulthandler_timeout=30
```

Observed final source-quality results: `All checks passed!`; `20 files already formatted`; mypy `Success: no issues found in 12 source files`; unittest `Ran 4 tests ... OK`. All exited 0. An initial Ruff run found line-length/import/format findings; formatting and small source corrections resolved them. No lint failure is hidden as a pass.

API unit run without TEST_DATABASE_URL: **19 passed, 1 explicitly skipped**. That run did not satisfy database integration. With the disposable PostgreSQL database configured, actual output was **20 passed** (exit 0, 0.99s). The integration test executed upgrade, seed twice, asserted two rows, read through FastAPI/PostgreSQL, rejected a false synthetic flag, downgraded the demo table, re-upgraded and reseeded. It refuses a database name lacking `_test`.

The initial sandboxed TestClient run stalled; it was interrupted without claiming a result. An isolated unsandboxed smoke test passed, followed by the successful full suite outside the restricted process sandbox. Initial PostgreSQL run emitted four deprecation warnings: three Alembic separator warnings resolved by `path_separator=os`, and one upstream Starlette/httpx TestClient warning remains non-blocking; CI API job passed with the current configuration. No production dependency compatibility claim is inferred from this testing warning.

## Actual frontend quality and dependency results

```powershell
npm.cmd install --workspace @amanah/web --save-exact next@16.4.6 react@19.3.1 react-dom@19.3.1
npx.cmd --yes npm@11 --version
npx.cmd --yes npm@11 install
npx.cmd --yes npm@11 update minimatch
npm.cmd audit --audit-level=moderate
npm.cmd run format
npm.cmd run format:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Additional explicit frontend development packages were installed into the workspace with `--save-dev --save-exact`; exact versions are in the manifest/lock. Initial npm 10.9.3 peer-tree installation failed with `Cannot read properties of null (reading 'edgesOut')`; temporary npm 11.21.2 resolved it without changing global npm.

Initial audit reported seven moderate findings in the lint parser/minimatch chain. A scoped override to minimatch 11.0.8 plus an actual `npm update minimatch` resolved the installed tree; `npm ls minimatch --all` confirmed that version beneath typescript-estree, leaving legacy 3.x consumers separate. Final audit: **found 0 vulnerabilities**, exit 0. Earlier manifest-only install/audit-fix attempts did not refresh the old tree and were not treated as successful remediation. See [ADR-005](../adr/ADR-005-hackathon-foundation.md) for the override tradeoff.

ESLint initially found a plain internal home anchor and anonymous PostCSS default export; Next Link/named config corrected them. Type checking rejected the obsolete Vitest esbuild JSX option; removed it and used the TypeScript JSX setting. Workspace ESM declaration resolves the config-loading warning.

Observed final results: Prettier `All matched files use Prettier code style!`; lint/typecheck exit 0; Vitest **1 test file / 10 tests passed**, including marker rejection, safe unavailable/failure states and server API boundary. Next production build compiled successfully and listed `/`, `/api/demo`, `/health` and the framework not-found page. No application test or clinical assertion is inferred from a build alone.

## Compose, browser and integrated results

```powershell
docker compose up --build api -d --wait --wait-timeout 180
docker compose up --build -d --wait --wait-timeout 180
python scripts/smoke_stack.py
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:e2e
docker compose ps --format 'table {{.Service}}\t{{.State}}\t{{.Health}}\t{{.Ports}}'
docker compose exec -T api alembic current
docker compose exec -T db psql -U amanah_demo -d amanah_demo -t -c 'SELECT count(*) AS fictional_rows, bool_and(is_synthetic) AS synthetic_only FROM demo_cases;'
```

All final commands succeeded. Initial Compose builds failed at the obsolete Vitest option, then at a missing shared fixture JSON in the web image. The source correction and explicit `COPY data/synthetic` resolved them; final fresh image build and all three health checks passed. Full development image export was slow on this workstation; it is a local verification image, not a production release image.

Observed stack:

```text
api  running  healthy  127.0.0.1:18000->8000/tcp
db   running  healthy  127.0.0.1:15432->5432/tcp
web  running  healthy  127.0.0.1:13000->3000/tcp
0001_demo (head)
2 | t
```

Exact smoke result:

```text
PASS: live/ready, 2 PostgreSQL fixtures, frontend->API->database, empty knowledge, 2 protected denials
```

Playwright local Edge: **4 passed (19.1s)**. It verified the browser/API/PostgreSQL path and refresh, missing/fabricated protected access, mobile 375px viewport without horizontal overflow, and keyboard skip navigation plus **zero detected axe A/AA violations** for the foundation page. This is not a complete accessibility audit or Arabic/clinical comprehension study. CI uses clean Chromium instead of Edge. Cosmetic NO_COLOR/FORCE_COLOR environment warnings did not affect assertions.

Desktop/mobile screenshots were visually inspected and copied without editing: [desktop](p02-desktop.png), [mobile](p02-mobile.png). They contain only invented participant labels. Local raw build/test artifacts under ignored artifacts/local and apps/web/test-results are reproducible working artifacts, not patient records or committed secrets.

## Observed GitHub Actions

Private-repository status was read through authenticated GitHub API requests using the existing Git credential manager only in process memory. No token was printed or written. The unrelated invalid `gh` CLI login was not changed.

- Initial [run 43712733453](https://github.com/AryanMedigeri08/Generisk/actions/runs/43712733453), head `891a065a990ea121497ec38467edd0933997d590`: api/web success, compose-smoke failure at Docker build (missing shared fixture).
- Corrected [run 43713023398](https://github.com/AryanMedigeri08/Generisk/actions/runs/43713023398), head `bcb03dbe09a004983eb9e518477c57129b9faff6`: **completed / success**; api **success**, web **success**, compose-smoke **success**.

Workflow uses immutable official action SHAs, read-only contents permission, PostgreSQL integration, web/API static/unit checks, dependency/credential checks and Compose/Chromium/axe smoke verification. No deployment or clinical integration job exists. A later documentation delivery triggers another run; its final observed SHA/status is reported on delivery without rewriting this immutable snapshot evidence.

## Credential, governance and delivery checks

Before application commit, `python scripts/check_secrets.py` observed **98 tracked text files / 0 findings**, exit 0; scanner regression tests **4 passed**. This checks known token/private-key/non-placeholder patterns and tracked env-file names, not comprehensive PHI or security assurance. No credentials are supplied by the fictional fixture source. `.env.example` contains only public local placeholders.

`git diff --cached --check` passed before application/fix commits and again with the final handoff/evidence staged. Historical P00 document validator rerun after scope/docs updates passed **185/185** checks at that intermediate state and **189/189** with final review links; its counts vary with README links and do not represent application tests or full clinical P00 acceptance.

Final staged `python scripts/check_secrets.py`: **100 tracked text files / 0 findings**, exit 0 (the two PNGs are binary). A read-only Python here-string piped to Python enumerated tracked Markdown, stripped code fences for link parsing, checked every local target/anchor and balanced fences, verified handoff sections 1-10 and separated gates, and re-counted the canonical APR/H rows. Observed output, exit 0:

```text
PASS: 39 Markdown files; 182 local links/anchors; balanced fences; 10 handoff sections
PASS: hackathon PASS / clinical BLOCKED; 8 APR PENDING / 12 H OPEN
```

The Markdown/phase check is document integrity only. The final delivery changes README review links, this evidence, handoff and two inspected screenshots; no runtime change after the green implementation snapshot. Final delivery's new CI run is checked separately before replying, without repeatedly committing a self-referential result.

No human clinical/legal sign-off, regulator clearance, production audit, real appointment, pathogenicity rule, personalized clinical probability, real user login or consent grant is present. H01-H12 remain OPEN and APR-01 to APR-08 PENDING. [P02 handoff](../../handoffs/P02-to-P03.md) requires review before any P03 work; future real-world service still requires its unresolved governance process.
