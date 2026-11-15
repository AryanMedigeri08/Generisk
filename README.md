# Amanah Genetics (Generisk)

P00 product and governance documentation only. **Synthetic-only; not approved for clinical use.** No application, clinical engine, real report ingestion, integrations or deployment exists.

Read [the roadmap](MASTER_ROADMAP.md), [decisions](docs/DECISIONS.md), [product charter](docs/product-charter.md), [intended use](docs/intended-use.md), [safety plan](docs/clinical-safety-plan.md), [regulatory assessment](docs/regulatory-applicability.md), [risk register](docs/risk-register.md) and [P00 handoff](handoffs/P00-to-P01.md).

P00 gate: **BLOCKED** pending human clinical/legal review and designation of the accountable operator. Draft artifacts are not approvals. P01 has not started.

The [delivery verification](docs/evidence/p00-delivery-verification.md) reconciles GitHub delivery and actual checks. The [governance approval register](docs/governance-approval-register.md) records all eight pending approvals and twelve open hazards. DEC-008 in the decision log is a **PROPOSED, INACTIVE** design-only exception requiring explicit product-owner authorization; it grants no current permission to begin P01.

## Verify the documentation

Requires Python 3.10+ and Git. No dependencies, environment variables, database or seed data are needed.

```powershell
python scripts/validate_p00.py
git diff --check
```

The validation checks document structure, local links, traceable hazards and the explicit blocked gate. It cannot establish legal applicability, clinical validity, bilingual comprehension or regulatory compliance. See [recorded evidence](docs/evidence/p00-validation.txt).

## Branch and review workflow

Use an individual `feature/<phase-or-feature>` branch for every new feature. P00 uses `feature/p00-product-governance`. Commit coherent progress and push the branch to [GitHub](https://github.com/AryanMedigeri08/Generisk). Review changes and gate evidence before a later merge into `main`; this task does not authorize starting P01. Never force-push shared history. Keep each handoff tied to an immutable implementation commit. Any credentials stay in the local credential manager, never in this repository.

The supplied roadmap, start prompt and handoff template remain planning inputs. Future-phase instructions in them are not authorization to execute those phases.
