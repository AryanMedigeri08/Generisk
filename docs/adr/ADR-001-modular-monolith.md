# ADR-001 — Proposed modular monolith

**DESIGN-ONLY / NOT APPROVED** | Status: DRAFT / PROPOSED | 2026-11-15, Asia/Calcutta

## Assumptions and dependencies

Early-stage synthetic-only design; no workload evidence, named operator or approved suppliers. APR-01/APR-04/APR-05/APR-08 remain PENDING; H05/H07/H10 OPEN. This ADR uses the roadmap's candidates and [restricted authorization](../DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation), not runtime procurement or deployment authority.

## Context

The product needs coherent consent, provenance, professional review and knowledge boundaries. Distributing these across independent services early would add identity, consistency, deployment and incident surfaces without current workload evidence. A single unrestricted application would also concentrate privilege and leakage risk.

## Proposed decision

Propose one modular FastAPI/Pydantic backend with explicit policy/consent, case/provenance, joint assessment/disclosure, review/referral, knowledge and audit interfaces. Propose a Next.js/React/TypeScript client with Arabic/English/accessibility requirements, and PostgreSQL relational metadata with separately reviewed schema/role boundaries. Identity could use an OIDC provider such as Keycloak; no provider, package version or configuration is approved.

All sensitive routes delegate to central resource/purpose/version policy; modules do not bypass it. Knowledge has no clinical-store entitlement. Durable jobs, object storage, pgvector and extracted services are later evidence-driven options, not initial provisioning.

## Alternatives and tradeoffs

- Microservices: independent scaling/failure boundaries, but more network authorization, tracing, operational and consistency complexity; defer until justified.
- Unstructured monolith: quickest conceptual path, but unclear ownership and dangerous cross-module data reach; reject as a design direction.
- Modular monolith: simpler early transactions/operations; larger failure/privilege blast radius and need for strict interface/data-access enforcement.

## Consequences and review gaps

Module diagrams do not enforce isolation. Security leads must evaluate privilege, secret/key handling and failure behavior; operator must approve hosting/identity/vendor locations; engineering must later verify concurrency, observability and workload targets. Nothing is installed or built. Named reviewers and acceptance evidence UNASSIGNED/PENDING. Read [architecture](../architecture.md), [data flows](../data-flows.md) and [threat model](../threat-model.md). Full P01 remains BLOCKED.
