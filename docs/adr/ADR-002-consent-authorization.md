# ADR-002 — Proposed independent consent and purpose authorization

**DESIGN-ONLY / NOT APPROVED** | Status: DRAFT / PROPOSED | 2026-11-15, Asia/Calcutta

## Assumptions and dependencies

Independent adults and fictional cases only. Lawful purposes, consent wording, retained rights, professional access and inference warnings are unresolved (APR-02/APR-03/APR-04/APR-05/APR-07/APR-08). H02/H03/H05/H06/H09 remain OPEN. No consent state machine or identity service is implemented.

## Context

One person's processing permission cannot convey the other's permission or a permanent right to joint results. Joint output itself may reveal private genetic facts. A login role alone cannot establish case access, and authorization cached before withdrawal may become unsafe.

## Proposed decision

Separate individual processing, exact-pair assessment and exact-output/audience disclosure decisions. Require independent grants and current purpose/resource/relationship checks; professional access also needs qualified role and assignment under an approved basis. Invitation acceptance alone creates no clinical entitlement.

Propose versioned attributable choices and authoritative rechecks at each protected commit/read. Revocation advances a permission version and blocks later dependent processing/access, including queued work and stale cached decisions. No downloadable joint exports initially. Corrections/scope/audience changes supersede dependent output authorization. Actual concurrency semantics need implementation-specific review/tests later.

## Alternatives and tradeoffs

- One couple-wide consent: superficially simpler but conflates independently owned choices and inference/disclosure; unsuitable proposal.
- Role-only access: simpler checks but cannot prevent cross-case/partner access or revoke purpose-specific entitlement; unsuitable.
- Per-resource/purpose/version checks: clearer control and auditable choices; more complex explanation, lifecycle, race and retention handling. Bilingual comprehension/coercion review is essential.

## Consequences and review gaps

Withdrawal cannot undo prior lawful viewing or automatically override legal retention. The private explanation for refusal/withdrawal must not appear in partner status. Counsel/privacy/clinical reviewers must settle bases, rights, exception cases, retention and wording; no consent alone is declared legally sufficient. Reviewer identities/acceptance PENDING. [Consent matrix](../consent-matrix.md), [API outline](../api-outline.md), [requirements AC-03 to AC-08](../requirements.md) and [UX](../ux-workflows.md) define review inputs. Full P01 remains BLOCKED.
