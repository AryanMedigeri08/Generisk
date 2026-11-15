# Synthetic-only hackathon milestones and acceptance

Date: 2026-11-15, Asia/Calcutta | Authority: DEC-009 current user project direction

## Scope and governance

Build a functional local demonstration with wholly invented fixtures and conspicuous “synthetic demonstration — not for clinical use” labels. No real patient enrollment, clinical decision-making, real genomic input, live healthcare/provider integration, commercial healthcare operation or public clinical deployment. The original [master roadmap](../MASTER_ROADMAP.md) and P00/P01 evidence remain the clinical-production planning history, not approvals.

P00/full clinical P01 remain BLOCKED. APR-01 through APR-08 stay PENDING; H01 through H12 OPEN. No expert sign-off is invented or waived for any future real service. The [DEC-009](DECISIONS.md#dec-009--hackathon-only-scope-revision-and-p02-authorization) software authorization is independent of those clinical gates.

## Engineering milestones

| Milestone | Authorized scope | Evidence / stop condition |
|---|---|---|
| Baseline reconciliation | Inspect/review P01, preserve history, establish main through normal merge | Baseline review and parent SHAs; no force push/default-branch change |
| P02 foundation — engineering PASS | Web/API/PostgreSQL/local Compose, fictional fixtures, safe providers and initial deny-all interfaces | Green exact tip 8ced145; preserved as the stacked parent, still unmerged |
| P03 identity/consent — CURRENT | User-authorized fictional authentication, independent invitations/consent, relationship checks and transactional audit | DEC-010 and attached authorization's 10 engineering criteria; actual PostgreSQL race/negative/browser tests; P03-to-P04 handoff |
| Later demo journeys — NOT AUTHORIZED HERE | Reviewed fictional ingestion/review/navigation and optional curated education | Separate scoped instructions, fixtures and engineering gates; no unsupported clinical claims |
| Any real-world service | Outside hackathon authorization | Reopen intended use, lawful basis/operator, clinical/legal/security approvals and original clinical gates |

## P02 hackathon engineering acceptance criteria

| ID | Reproducible required behavior |
|---|---|
| ENG-01 | Documented `docker compose up --build -d --wait` starts web/API/database with loopback-only host exposure and health checks |
| ENG-02 | Production frontend build/type/lint/format and API lint/format/type/tests pass with pinned resolved dependencies |
| ENG-03 | Alembic upgrades empty PostgreSQL, rollback/re-upgrade works, idempotent fictional seed loads expected rows |
| ENG-04 | Browser/frontend request reaches API and PostgreSQL and displays only labelled fictional fixtures; unavailable API/database degrades safely |
| ENG-05 | Health liveness/readiness distinguish running process from ready migrated database; consistent sanitized errors never expose stack traces/configuration |
| ENG-06 | Protected routes deny missing/fabricated tokens, roles and identifiers; authentication/consent interfaces grant nothing; no P03 bypass switch |
| ENG-07 | Empty KnowledgeProvider and ClinicalRulesProvider return safe unavailable states without probabilities, model calls or patient-derived content |
| ENG-08 | Environment templates use obvious local placeholders only; tracked secret scan passes; no real clinical/genetic fixtures, uploads or arbitrary data-entry route |
| ENG-09 | GitHub Actions runs web/API/PostgreSQL/migration/negative checks and a Compose smoke path; record actual run status separately from local tests |
| ENG-10 | README/local-development/testing docs and P02 handoff give exact commands/results, snapshot SHA, limitations, separate engineering and clinical gates and P03 review prerequisite |

## Handoff and branch rules

Use a separate feature branch for each milestone/feature. Push coherent checkpoints. Preserve existing branches/history. `main` is the stable reviewed documentation baseline until P02 is reviewed and separately merged; its creation does not require changing GitHub's default branch. Baseline merge review is an assistant engineering/document review authorized by the user's Step 1, not a human clinical/legal review or a fabricated GitHub approval.

Engineering gate PASS requires observed criteria, FAIL records reproducible unmet behavior, BLOCKED identifies an unmet external prerequisite. Clinical-production gate remains BLOCKED regardless of engineering success. Do not hide missing Docker/CI evidence behind a green unit test. Record failures and fixes; no invented tests/approvals. Handoffs cite immutable implementation snapshots and report their own delivery SHA separately to avoid self-reference.
