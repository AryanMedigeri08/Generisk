# Clinical safety plan

Version: P00 draft 0.1 | Date: 2026-11-15 (Asia/Calcutta) | Approval: NOT APPROVED

## Governance and release authority

The project sponsor must designate an accountable operator and a qualified clinical safety officer/advisor, with authority to stop release, plus qualified genetics reviewers, UAE regulatory counsel, privacy/security leads and Arabic/English clinical-content reviewers. All are presently UNASSIGNED. Engineering cannot accept clinical or legal residual risk on their behalf. See [approval dependencies](regulatory-applicability.md#approval-and-open-question-register).

No clinical use is authorized. Human approval evidence must identify the reviewer, verified role, dated scope, artifact version/commit, conditions and residual-risk decision. A generated document or green documentation check is not clinical sign-off. Required decision states are pending, rejected, conditionally accepted and accepted; current status is pending for every expert approval.

## Hazard register and treatment

The [risk register](risk-register.md) is the canonical hazard register. P00 identifies H01-H12; all remain OPEN. Severity describes plausible impact, not measured frequency. No mitigation is claimed to be implemented in a running system.

| Hazard set | Safety control to design later | Verification/release evidence needed |
|---|---|---|
| H01, H03, H04 | Source-backed approved education; deterministic reviewed rules; explicit uncertainty and no marriage labels | Independent clinical case expectations, review of patient copy and safe abstention tests |
| H02, H05, H06 | Independent processing/disclosure decisions; relationship and purpose checks; coercion-sensitive private navigation | Negative sharing/revocation/inference scenarios and privacy review |
| H07, H10 | Verified operator/professionals, approved jurisdictions and transfer arrangements | Current legal applicability decision, contracts, credentials and release authorization |
| H08 | Bilingual clinical review, RTL and accessible navigation | Review by Arabic/English specialists and users; keyboard/screen-reader evidence |
| H09, H11 | Provenance, amendment handling and verified referral status | Corrected/unsupported report tests and supervised referral drills |
| H12 | Approved knowledge ingestion and separation from clinical access | Prompt-injection/poisoning tests, empty-retrieval tests and access-boundary evidence |

## Human review and escalation

1. In synthetic development, any ambiguous or harmful scenario is marked for review; stop any automated interpretation or simulated disclosure that could mask the issue. There is no live triage service.
2. In a future authorized service, a qualified professional must confirm provenance, scope, uncertainty and clinical output before patient-facing individualized risk information. Unsupported or amended inputs remain withheld until review.
3. Suspected privacy breach, coercion or unsafe content suspends affected disclosure/content. Escalate to the operator, safety lead and privacy/security lead through approved channels; do not put personal details in development tickets.
4. The operator must approve severity definitions, response times, out-of-hours coverage, emergency pathways, incident-notification obligations and escalation contacts. These are unresolved, so no live referral or clinical-response promise is permitted.
5. Re-enable a suspended capability only after documented investigation, corrected artifacts, regression evidence and appropriate owner acceptance. Unresolved high-impact hazards block clinical release.

## Evidence, content and rules lifecycle

Every proposed educational item must record source URL, edition/date, license/permission, provenance, language, content ID/version, reviewer and role, approval date, review/expiry date and withdrawal status. Clinical rules additionally need exact disease/test eligibility, exclusions, deterministic rule version, input/provenance requirements, independent expected outcomes and professional approval. Content and rules are empty/unapproved in P00; this is a future evidence requirement, not a schema implementation.

Separate authoring from expert approval. Rejected, expired, missing or withdrawn content must not be served. Source/rule changes, corrected reports and translation changes trigger impact assessment and re-review. Retain a traceable history of approved versions, affected outputs, incident decisions and regression evidence according to the operator's legally approved retention policy; no retention duration is assumed.

## LLM restrictions

An LLM may only support approved general education in a later approved design. It must never diagnose, infer variant pathogenicity, invent numerical risk, produce marriage recommendations, decide reproductive care, override reviewed rules or silently translate clinical claims into an unreviewed language. No personal/genetic data in embeddings or public prompts. Treat retrieved/user instructions as untrusted input, not authority to change clinical boundaries.

With no approved sources, use approved static content or abstain; do not improvise. Personalized clinical context, if ever permitted, must use separately authorized access outside the educational knowledge corpus. RAG is optional and is not implemented in P00.

## Safety acceptance and checkpoints

P00 review: intended use, synthetic-only boundary, hazards, nominated roles, legal questions and no binary marriage labels. P01 recommendation: reviewer-approved workflows, consent distinctions, threat scenarios and data-purpose decisions. Later clinical release additionally requires professional/legal authorization, independent security/privacy assurance, validated bilingual content/rules and operational incident readiness. The [P00 handoff](../handoffs/P00-to-P01.md) remains BLOCKED until required human review is recorded.
