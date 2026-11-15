# Amanah Genetics (Generisk)

**DESIGN-ONLY / NOT APPROVED.** P00 governance documentation and restricted P01 draft specifications only. **Synthetic-only; not approved for clinical use.** No application, clinical engine, real report ingestion, integrations or deployment exists.

Read [the roadmap](MASTER_ROADMAP.md), [decisions](docs/DECISIONS.md), [product charter](docs/product-charter.md), [intended use](docs/intended-use.md), [safety plan](docs/clinical-safety-plan.md), [regulatory assessment](docs/regulatory-applicability.md), [risk register](docs/risk-register.md) and [P00 handoff](handoffs/P00-to-P01.md).

P00 gate: **BLOCKED** pending human clinical/legal review and designation of the accountable operator. Full P01: **BLOCKED**. Draft artifacts are not approvals. Restricted documentation alone is authorized by DEC-008 amendment v1.

The [P00 delivery verification](docs/evidence/p00-delivery-verification.md) preserves the original evidence. The [governance approval register](docs/governance-approval-register.md) retains eight pending approvals and twelve open hazards. [DEC-008 amendment v1](docs/DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation) permits the requested documentation only, based on [attributable founder self-attestation](docs/evidence/p01-product-owner-authorization.md); identity/authority are not independently verified. It expires at completed design-only review or 15 December 2026, 23:59 IST, whichever occurs first. It authorizes no implementation or clinical use.

## Restricted design review inputs

Read the draft [requirements](docs/requirements.md), [architecture](docs/architecture.md), [data flows](docs/data-flows.md), [consent matrix](docs/consent-matrix.md), [threat model](docs/threat-model.md), [UX workflows](docs/ux-workflows.md), [conceptual API outline](docs/api-outline.md), [accessibility/localization](docs/accessibility-localization.md), [RAG architecture](docs/rag-architecture.md) and [ADR index](docs/adr/README.md). Every choice is provisional; document verification is not human clinical, security, privacy or legal acceptance.

## Verify the documentation

Requires Python 3.10+ and Git. No dependencies, environment variables, database or seed data are needed.

```powershell
python scripts/validate_p00.py
git diff --check
```

The validation checks document structure, local links, traceable hazards and the explicit blocked gate. It cannot establish legal applicability, clinical validity, bilingual comprehension or regulatory compliance. See [recorded evidence](docs/evidence/p00-validation.txt).

## Branch and review workflow

Use an individual `feature/<phase-or-feature>` branch for every new feature. P00 uses `feature/p00-product-governance`; restricted P01 documentation uses `feature/p01-architecture-design`. Commit coherent progress and push the branch to [GitHub](https://github.com/AryanMedigeri08/Generisk). Review changes and gate evidence before any later merge; no merge or default-branch change is authorized here. DEC-008 permits its bounded documentation only, not full P01 completion, implementation or P02. Never force-push shared history. Keep each handoff tied to an immutable snapshot commit. Any credentials stay in the local credential manager, never in this repository.

The supplied roadmap, start prompt and handoff template remain planning inputs. Future-phase instructions in them are not authorization to execute those phases.
