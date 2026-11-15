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
| DEC-008 | Proposed restricted P01 DESIGN-ONLY exception for synthetic-only architecture documentation while human P00 approvals remain pending | Could permit explicitly bounded design exploration without passing P00 or permitting implementation; details below | **PROPOSED; NOT ACCEPTED; INACTIVE.** Product-owner authorization PENDING; product-owner identity/authority UNASSIGNED |

Evidence and next-scope recommendation are in [the P00 handoff](../handoffs/P00-to-P01.md). Future changes must preserve decision history and record reviewer, scope and artifact version.

## DEC-008 — Proposed restricted P01 DESIGN-ONLY exception

- **Status:** PROPOSED. NOT ACCEPTED. INACTIVE.
- **Proposed on:** 2026-11-15 (Asia/Calcutta), during P00 verification/governance reconciliation at the user's request. This request authorizes drafting the proposal only; it does not activate the exception or start P01.
- **Decision maker:** Product owner; named identity and evidence of authority UNASSIGNED. Authorization record, date, effective scope, expiry/review date and target commit are PENDING.
- **Problem:** The current P00 handoff blocks P01 while expert acceptance and accountable-role assignments are missing. A narrow, explicitly authorized exception could permit architecture options to be documented without representing those open decisions as settled.
- **Proposed permitted scope, only after activation:** Markdown architecture options, static diagrams and draft architecture decision records using wholly fictional scenarios. Label each artifact DESIGN-ONLY / NOT APPROVED, list assumptions and unanswered APR/H dependencies, and leave unresolved clinical/legal/data-handling choices PENDING. This permits architecture documentation only, not full P01 execution or a P01 gate PASS.
- **Exclusions:** No application code, executable API/contracts, database/schema/migrations, auth/consent runtime, UI, CI/deployment/infrastructure provisioning, report ingestion, patient recruitment, real health information, model/RAG execution, numerical clinical rules, real providers/integrations or clinical claims. No P02 or later work. De-identified or pseudonymized real records do not qualify as synthetic.
- **Preserved governance:** P00 stays BLOCKED. APR-01 through APR-08 stay PENDING and H01 through H12 stay OPEN unless independently supported and accepted by the appropriate qualified reviewer. The exception would authorize only the named design activity; it would not satisfy APR-08's full P00 acceptance or waive any clinical, legal, privacy, security or regulatory approval. Product-owner authorization cannot substitute for expert sign-off.
- **Activation evidence required:** An explicit product-owner statement accepting the exact DEC-008 version/commit and the permitted/excluded scope; named owner and evidence of authority; authorization date/time, permitted artifacts, purpose, review/expiry condition, and acknowledgement of the BLOCKED gate and remaining risks. Record the statement or an approved evidence reference in the governance register before changing status. All activation fields are currently PENDING. Silence, a Git push/merge, drafting instructions, a successful check or this proposal is not authorization.
- **If later activated:** Record the decision separately with its evidence and scope before any dependent work. A subsequent authorized design task would use its own feature branch. Do not start that task in this P00 reconciliation. Design remains provisional until qualified reviewers resolve its dependencies.
- **Stop conditions:** Missing/expired/withdrawn authorization, uncertain scope, attempted implementation/real-data handling, unsupported claims, or a safety/privacy/legal conflict. Stop affected work and return the decision to the product owner and relevant qualified reviewer; do not silently broaden the exception.
- **Current outcome:** No authorization evidence received; DEC-008 remains PROPOSED and INACTIVE. P01 has not started.

See [the reconciled governance register](governance-approval-register.md) and [delivery verification](evidence/p00-delivery-verification.md). DEC-001 and DEC-005 continue to apply without change until an explicitly recorded decision authorizes a bounded exception.
