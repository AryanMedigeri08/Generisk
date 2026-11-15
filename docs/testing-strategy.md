# P02 hackathon verification strategy

DEC-009 separates synthetic prototype engineering from unresolved clinical-production governance. Engineering gate criteria ENG-01 to ENG-10 are in [hackathon milestones](hackathon-roadmap.md). Never report runtime/security/clinical assurances from a document check alone.

## Executed-check categories

| Layer | Tool / command | Meaning and limit |
|---|---|---|
| API static quality | Ruff lint/format; strict mypy over src | Coding/type checks; no runtime security certification |
| API unit/negative tests | pytest with isolated in-memory test database | Health/error/log redaction, safe providers, forged/missing credentials and deny-all consent; does not implement P03 entitlement semantics |
| PostgreSQL integration | pytest with disposable TEST_DATABASE_URL ending `_test` | Actual Alembic upgrade/down/re-upgrade, idempotent seed, database constraint and API reads; absence is an explicit skip |
| Frontend quality | ESLint, Prettier, tsc, Next production build | Client/server foundation compiles; no clinical copy approval |
| Frontend tests | Vitest/Testing Library | Fictional marker rejection, safe empty state, refresh/failure behavior and server fetch boundary |
| Browser | Playwright against running Compose | Complete browser/frontend/API/PostgreSQL path, mobile viewport, keyboard skip navigation and forged-token denial |
| Accessibility sample | axe-core/Playwright | Automated A/AA rule scan on the foundation; no complete certification or Arabic/low-literacy study |
| Stack | docker compose config/up --wait; scripts/smoke_stack.py | Healthy local service startup and integrated readonly fixture interaction |
| Credential patterns | scripts/check_secrets.py and four regression tests | Tracked token/private-key/non-placeholder credential patterns; not comprehensive PHI/secret detection |
| Supply chain | npm audit, exact lockfiles, immutable Actions SHAs | Report actual advisory results; not an independent software security assessment |

## Reproducible commands

From root after installing the documented dependencies:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
.\.venv\Scripts\python.exe -m ruff check services/api scripts/check_secrets.py scripts/smoke_stack.py tests
.\.venv\Scripts\python.exe -m ruff format --check services/api scripts/check_secrets.py scripts/smoke_stack.py tests
.\.venv\Scripts\python.exe -m mypy --config-file services/api/pyproject.toml services/api/src
.\.venv\Scripts\python.exe -m pytest -c services/api/pyproject.toml services/api/tests
.\.venv\Scripts\python.exe -m unittest discover -s tests
python scripts/check_secrets.py
docker compose up --build -d --wait --wait-timeout 180
python scripts/smoke_stack.py
npm run test:e2e
```

See [local development](local-development.md) for TEST_DATABASE_URL and local browser setup. Optional pre-commit integration is defined in `.pre-commit-config.yaml`; installation is a developer action, not assumed merely because the config exists. CI runs the scanner regardless. The scanner inspects tracked working-tree content; stage all intended files before a precommit delivery scan.

## Failure and handoff discipline

Record exact commands, observed counts, skipped cases, failures/fixes, CI run URL/head SHA, implementation snapshot and final delivery SHA in P02 evidence/handoff. A skipped database test or unobserved CI run cannot satisfy its engineering criterion. Keep public placeholder passwords distinguished from actual secrets without printing matched secret values.

P00/full clinical P01 remain BLOCKED, APR-01 through APR-08 PENDING, H01 through H12 OPEN regardless of a hackathon engineering PASS. No real upload, personalized probabilities, clinical diagnosis, marriage judgement, professional appointment or provider integration is tested/implemented. P03 work must wait for reviewed handoff and its own authorized scope.
