# Amanah Genetics (Generisk)

**Synthetic-only hackathon prototype — not for clinical use.** P02 provides a local Next.js/FastAPI/PostgreSQL foundation with invented fixtures. There are no real patient records, genetic results, medical answers, login/consent grants, live integrations or appointment bookings.

Current scope is [DEC-009](docs/DECISIONS.md#dec-009--hackathon-only-scope-revision-and-p02-authorization) and the [hackathon milestones/engineering gates](docs/hackathon-roadmap.md). Historical clinical-production P00/full P01 remain **BLOCKED**, eight approvals **PENDING**, twelve hazards **OPEN**. An engineering PASS does not imply clinical certification, regulatory compliance or authorization for real health information.

## Start the local demonstration

Requires Docker Engine/Desktop with Linux containers and Docker Compose v2. From the repository root:

```powershell
docker compose up --build -d --wait --wait-timeout 180
```

Open [the demonstration](http://localhost:13000). API [liveness](http://localhost:18000/health/live), [readiness](http://localhost:18000/health/ready) and [local API reference](http://localhost:18000/docs) are available on loopback. Host database port is 15432. No `.env` is necessary: defaults are deliberately public local placeholders; `.env.example` documents optional port overrides. Never use these credentials for real data or external hosting.

The API applies migration `0001_demo` and idempotently seeds two explicitly fictional records. The frontend reads them through a server-side API boundary. Empty knowledge returns unavailable. Every protected route denies missing or invented credentials. The UI has no data-entry/upload flow and no clinical interpretation.

```powershell
python scripts/smoke_stack.py
docker compose down
```

Stopping preserves the synthetic local database volume. See [local development](docs/local-development.md) for native commands and disposable migration tests, and [testing strategy](docs/testing-strategy.md) for actual verification scope.

## Repository and quality checks

`apps/web` contains the accessible frontend foundation; `services/api` the modular API, interfaces, migrations and tests; `data/synthetic` invented fixtures; `scripts` stack smoke/limited credential scanning; `.github/workflows/ci.yml` the initial CI. Root npm workspaces share a lockfile. Python runtime and verification dependencies are locked in `services/api/requirements.lock`.

With Node 22.13+ and Python 3.10+:

```powershell
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/api/requirements.lock
.\.venv\Scripts\python.exe -m ruff check services/api scripts/check_secrets.py scripts/smoke_stack.py tests
.\.venv\Scripts\python.exe -m mypy --config-file services/api/pyproject.toml services/api/src
.\.venv\Scripts\python.exe -m pytest -c services/api/pyproject.toml services/api/tests
python scripts/check_secrets.py
```

Without `TEST_DATABASE_URL`, PostgreSQL integration is explicitly skipped; it is not a passing database test. CI supplies a disposable `_test` database and also builds/starts Compose, runs smoke checks, and runs browser/accessibility tests. The [engineering ADR](docs/adr/ADR-005-hackathon-foundation.md) records selected boundaries and the narrowly scoped lint dependency override. Credential scanning is limited pattern detection, not a comprehensive PHI/security assessment.

## Branch and review workflow

`main` was established by a normal reviewed documentation merge; its [review and parent hashes](docs/evidence/p02-baseline-review.md) preserve all prior work. P02 uses `feature/p02-hackathon-foundation`. Push coherent feature checkpoints; review before merging into main. This task does not merge P02 or change GitHub's default branch. No force pushes or automatic phase advancement. P03 must wait for review of the P02 handoff and its own authorized scope.

## Historical design and clinical governance

The [master roadmap](MASTER_ROADMAP.md), [P01 design handoff](handoffs/P01-design-only-review.md), [product charter](docs/product-charter.md), [intended use](docs/intended-use.md), [safety plan](docs/clinical-safety-plan.md), [regulatory assessment](docs/regulatory-applicability.md), [risk register](docs/risk-register.md) and [governance register](docs/governance-approval-register.md) remain review inputs for any future real-world service. They are not clinical approvals. DEC-009 supersedes the earlier documentation-only implementation restriction solely for this fictional hackathon P02 track.
