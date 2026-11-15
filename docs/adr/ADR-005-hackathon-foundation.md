# ADR-005 — Synthetic-only P02 foundation

Date: 2026-11-15, Asia/Calcutta | Status: ACCEPTED for hackathon engineering under DEC-009; not clinical approval

## Context and decision

The user explicitly changed the current target to a functional, fictional hackathon demonstration and authorized P02 implementation. Historical ADR-001 through ADR-004 remain unapproved clinical-service design inputs. [DEC-009](../DECISIONS.md#dec-009--hackathon-only-scope-revision-and-p02-authorization) supersedes their implementation stop only for the narrow synthetic engineering track.

Use Next.js/TypeScript/React and Tailwind for an accessible readonly foundation; modular FastAPI/Pydantic and SQLAlchemy/Alembic for API and fictional PostgreSQL fixtures. Lock resolved npm/Python dependencies. Docker Compose binds host ports only to loopback and uses conspicuous public development placeholders. No deployment workflow or external integration is included. Node/Python container images are development verification environments, not certified production images.

Identity and consent are Protocol interfaces with unavailable/deny-all implementations. Protected routes cannot grant access even if a request supplies an invented token or role. Public fixture endpoints expose only invented records and prohibit health data entry/uploads. KnowledgeProvider has an empty corpus and safe unavailable response; ClinicalRulesProvider likewise returns unavailable, with no inputs or numerical rules. No worker, RAG model/vector execution, OIDC login or P03 consent state machine is built.

## Alternatives and tradeoffs

- Static-only UI would be simpler but would not prove API/database/migration interaction required for the hackathon foundation; use real local PostgreSQL with fictional records.
- Mock login/allow-all demo tokens would make later screens easier but obscure missing P03 authorization; use deny-all boundaries now.
- A broad clinical schema/rules engine would exceed scope and create unsupported claims; use only minimal synthetic fixture metadata.
- Development dependencies remain in the local Docker image for verification simplicity; a production build/release image is outside current authorization.

## Dependency resolution and verification

Resolved runtime versions include Next 16.4.6, React 19.3.1 and Tailwind 4.3.5; exact trees live in the lockfiles. npm 10.9.3 failed peer-tree installation; a temporary npm 11.21.2 CLI resolved it without changing global npm. The developer manifest records that package-manager version.

The upstream typescript-estree dependency required vulnerable minimatch 10.x (GHSA-g3hv-75wg-m249). A scoped override selects minimatch 11.0.8 only beneath that lint parser; legacy minimatch 3.x consumers are not globally rewritten. `npm update minimatch` was needed to actually refresh the old installed tree/lock, rather than assuming a manifest override had taken effect. Audit/lint/type/build tests must verify the resolved tree; revisit/remove the override when the upstream parser constraint adopts a fixed release.

Foundation logs omit paths/query/body/headers/exception detail; responses carry a generated request ID. Readiness checks the expected migration and a seeded row, not process existence alone. Unit tests are separate from real PostgreSQL migration/rollback and browser checks. These controls are limited prototype engineering; H05/H06/H07 and every other clinical-production hazard remain OPEN, APR-01 to APR-08 PENDING.

## Review and next stage

Record actual results and CI status in P02 evidence/handoff; do not infer them from this ADR. P02 stays on its feature branch pending review. No P03 or merger of application work is authorized before that review and the next scoped instruction. Clinical/legal/operator/privacy/security responsibilities and real-world hosting/retention/classification remain unresolved.
