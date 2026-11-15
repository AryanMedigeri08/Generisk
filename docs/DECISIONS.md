# Decision log

Date: 2026-11-15 (Asia/Calcutta). These are P00 planning decisions, not expert approval. No architecture ADR or P01 design is created.

| ID | Decision | Reason / consequence | Approval state |
|---|---|---|---|
| DEC-001 | Execute P00 only; leave P01-P13 untouched | User scope; create documentation and handoff, no application/clinical engine | Authorized scope; execution documented |
| DEC-002 | Synthetic-only; adult independent-participation MVP proposal | Minimize exposure while clinical/legal/operator roles are unresolved; real data and minors excluded | Draft product scope pending clinical/legal review |
| DEC-003 | Prioritize education, independent choice and simulated reviewed/referral journeys | No disease panel, numerical rules, source corpus or provider agreement approved | Proposal pending human acceptance |
| DEC-004 | No marriage recommendations or compatibility binary labels; separate risk from diagnosis | Reduce coercion, stigma and unsupported claims | Documented restriction; clinical wording review pending |
| DEC-005 | P00 gate is BLOCKED, even if documentation checks pass | No invented clinical/legal signatures or designated operator | Pending APR-01/APR-02/APR-03/APR-08 |
| DEC-006 | Use feature/p00-product-governance for P00 and a new feature branch for each future feature | User requests incremental GitHub updates and later merge | No merge or P01 execution performed |
| DEC-007 | Treat official source titles/metadata as preliminary, not full legal review | Direct retrieval failed; counsel must verify current authoritative texts and applicability | Source gap D02 remains open |

Evidence and next-scope recommendation are in [the P00 handoff](../handoffs/P00-to-P01.md). Future changes must preserve decision history and record reviewer, scope and artifact version.
