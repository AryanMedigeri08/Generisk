# Draft architecture decision index

Current P03 engineering amendment: [ADR-006](ADR-006-demo-identity-consent.md) records the authorized local fictional identity/consent implementation under DEC-010. It does not approve the clinical-service drafts below.

Current hackathon amendment: [ADR-005](ADR-005-hackathon-foundation.md) is an engineering decision under DEC-009. The P01 ADR-001 through ADR-004 below remain DRAFT/PROPOSED for any future real-world service; no clinical approval is conferred.

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

ADR-001 through ADR-004 have no qualified architecture/security/clinical/legal acceptance. Each needs recorded review for real-world service. The later user direction in DEC-009 separately authorizes only fictional hackathon P02 implementation; ADR-005 records that engineering choice without closing the older approval gaps.
