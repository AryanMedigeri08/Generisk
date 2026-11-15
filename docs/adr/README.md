# Draft architecture decision index

**DESIGN-ONLY / NOT APPROVED** | 2026-11-15, Asia/Calcutta

## Assumptions and dependencies

These are DRAFT / PROPOSED design choices under [DEC-008 amendment v1](../DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation), not approved architecture or implementation authorization. P00 and full P01 remain BLOCKED; APR-01 through APR-08 PENDING; H01 through H12 OPEN.

| ADR | Proposal | Principal unresolved dependencies |
|---|---|---|
| [ADR-001](ADR-001-modular-monolith.md) | Modular monolith and candidate technology boundaries | APR-01/APR-05; H05/H07/H10 |
| [ADR-002](ADR-002-consent-authorization.md) | Independent scoped permissions and resource/purpose checks | APR-02/APR-04/APR-05; H02/H03/H06/H09 |
| [ADR-003](ADR-003-knowledge-clinical-separation.md) | Approved educational knowledge separated from clinical records/rules | APR-02/APR-04/APR-06; H01/H04/H05/H08/H12 |
| [ADR-004](ADR-004-hosting-retention.md) | Defer hosting/retention/classification decisions pending experts | APR-01/APR-03/APR-04/APR-05; H05/H07/H10 |

## Review gaps

No ADR is ACCEPTED by an architecture, security, clinical or legal reviewer. Each requires recorded review at an exact commit, conditions and supersession history. A product-owner authorization to draft these documents is not approval of their contents. Future implementation and P02 require separate authorization.
