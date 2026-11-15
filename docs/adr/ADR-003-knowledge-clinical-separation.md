# ADR-003 — Proposed separation of education, clinical records and rules

**DESIGN-ONLY / NOT APPROVED** | Status: DRAFT / PROPOSED | 2026-11-15, Asia/Calcutta

## Assumptions and dependencies

No approved corpus, clinical rules, disease/test panel, model/provider or bilingual fallback. APR-02/APR-03/APR-04/APR-05/APR-06 remain PENDING; H01/H04/H05/H08/H12 OPEN. [DEC-008](../DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation) authorizes documentation only, not model/RAG execution.

## Context

Mixing patient information into educational retrieval risks unauthorized disclosure and makes clinical authority ambiguous. Plausible generated content is not approved clinical evidence. Static education/navigation should not depend on retrieval availability.

## Proposed decision

Define KnowledgeProvider as a conceptual approved-reference abstraction with source/license/language/version/approval filtering and safe empty behavior. Keep it separate from clinical records and a future ClinicalRulesProvider for deterministic clinician-approved rules. No patient-derived embeddings, report ingestion into knowledge or arbitrary clinical tool access.

Begin any later authorized implementation with empty/approved-static behavior; pgvector could be an optional adapter only after content, hosting and evaluation decisions. Missing/expired/unsupported-language content produces reviewed fallback or generic unavailability, never improvised clinical advice or automatic clinical translation. Clinical output may only originate in separately approved deterministic/professional logic, not the language model.

## Alternatives and tradeoffs

- Single patient-and-reference vector store: convenience at the cost of disclosure/purpose boundaries and difficult deletion/access reasoning; reject as a design direction.
- Model-only answers: convenient coverage but unsupported claims and unreliable attribution; reject.
- Approved static-first separated knowledge: limited coverage and additional approval/version workflow, but explicit provenance and safe empty state. Similarity scores do not establish clinical validity.

## Consequences and review gaps

Source licensing, clinical/bilingual approval, poisoning/injection defenses, output constraints and approved vendor/location choices are required even with separation. No retrieval evaluation or clinical safety evidence exists. Named reviewers/acceptance PENDING. See [RAG architecture](../rag-architecture.md), [threats](../threat-model.md), [intended use](../intended-use.md) and [data flows](../data-flows.md). Full P01 remains BLOCKED.
