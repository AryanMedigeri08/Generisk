# Restricted P01 requirements and acceptance scenarios

**DESIGN-ONLY / NOT APPROVED** | Draft 0.1 | 2026-11-15, Asia/Calcutta

Authorization: [DEC-008 amendment v1](DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation), baseline `9dedc9b87ae30da74171c6aaa63292ed4134baf6`. This specifies future behavior, not implemented functionality or passed tests. P00 and full P01 remain BLOCKED.

## Assumptions and dependencies

Adults participating independently, fictional records only, no selected disease/test panel and no approved clinical corpus. Clinical scope, lawful purposes, hosting, retention and software classification remain PENDING under APR-01, APR-02, APR-03, APR-04 and APR-05. All H01-H12 remain OPEN. [Governance](governance-approval-register.md) and [intended use](intended-use.md) override any interpretation that these proposals authorize real clinical activity.

## Personas and boundaries

| Persona | Goal | Boundary / dependency |
|---|---|---|
| Individual | Read approved education privately; understand choices and review status | No inference about partner findings; H02/H04/H08, APR-02/APR-06 |
| Invited partner | Independently accept, refuse or withdraw a specific purpose | Invitation is not consent; H02/H03/H06, APR-04 |
| Qualified counsellor | Review an assigned, authorized case with provenance | Verified professional role plus current assignment/purpose, not role alone; H09/H10, APR-01/APR-07 |
| Administrator | Manage accounts/support and operations without genetic detail | No default clinical access or partner linkage; H05/H10, APR-04/APR-05 |
| Safety/content reviewer | Withdraw unsafe/expired material and assess evidence | Separate authoring/approval; no assumed appointment; H01/H12, APR-02/APR-06 |

## Functional requirements

| ID | Proposed requirement | Acceptance scenario | Traceability |
|---|---|---|---|
| FR-01 | Serve only approved, current general education in the requested reviewed language | AC-01 | APR-02/APR-06; H01/H04/H08 |
| FR-02 | Missing/empty/withdrawn knowledge returns reviewed fallback or safe unavailability, without model improvisation | AC-02 | APR-02/APR-06; H01/H12 |
| FR-03 | Maintain private individual case ownership independent of invitations | AC-03 | APR-04; H02/H05 |
| FR-04 | Invite a second adult using minimal, non-clinical information and independently authenticate acceptance | AC-04 | APR-04/APR-05; H02/H03 |
| FR-05 | Separate individual processing, joint assessment and joint-result disclosure choices | AC-05 | APR-02/APR-04; H02/H06 |
| FR-06 | Refusal, expiry or withdrawal never exposes another person's findings or coerces participation | AC-06 | APR-04/APR-06; H02/H03/H06 |
| FR-07 | Enforce current subject, role, relationship, assignment, purpose and permission version on each sensitive operation | AC-07 | APR-04/APR-05; H02/H05 |
| FR-08 | Withdraw future permission atomically with a version change; recheck before committing work or disclosure | AC-08 | APR-04/APR-05; H06 |
| FR-09 | Future import preserves source/version/status, and unsupported/amended inputs block stale interpretation | AC-09 | APR-02/APR-07; H09 |
| FR-10 | Individualized output requires approved deterministic rules, supported inputs and qualified review | AC-10 | APR-02/APR-03/APR-07; H01/H04/H10 |
| FR-11 | Review status is distinct from an authorized disclosure; audience and output version are explicit | AC-05/AC-08 | APR-02/APR-04; H02/H06/H09 |
| FR-12 | Referrals remain simulated until an approved provider confirms a real appointment | AC-11 | APR-01/APR-07; H10/H11 |
| FR-13 | Support/admin views exclude clinical findings by default | AC-12 | APR-04/APR-05; H05 |
| FR-14 | Sensitive decisions/actions generate minimal append-only audit events; audit failure blocks sensitive action | AC-13 | APR-04/APR-05; H05/H06 |
| FR-15 | Arabic/English, RTL, keyboard/screen-reader and plain-language choices are equivalent | AC-14 | APR-06; H08 |
| FR-16 | Reject diagnosis, marriage recommendation, reproductive directives and unsupported numerical claims | AC-15 | APR-02/APR-03/APR-06; H01/H03/H04 |
| FR-17 | Treat retrieved text and user instructions as untrusted; no PHI in educational embeddings/prompts | AC-16 | APR-04/APR-05/APR-06; H05/H12 |
| FR-18 | Suspension of content/case access blocks downstream display until authorized re-review | AC-09/AC-16 | APR-02/APR-05; H01/H09/H12 |

## Acceptance scenarios — future verification, not executed tests

| ID | Given / when | Expected observable outcome |
|---|---|---|
| AC-01 | Requested item is approved/current and its language version matches | Display that exact version with provenance and limitations; otherwise AC-02 |
| AC-02 | Corpus is empty or language/source approval missing | Safe unavailable state; no invented answer, citation or translation; navigation to approved help only |
| AC-03 | Fictional `syn-person-a` requests `syn-person-b`'s case by changed identifier | Generic non-enumerating denial, no clinical fields or existence metadata |
| AC-04 | Invitation token is forwarded/replayed, expired or accepted without authentication | No relationship/permission created; authenticated intended recipient and valid token required; expiry policy PENDING |
| AC-05 | Both permit assessment but one has not separately permitted disclosure of output version V | No joint result released; invitations and processing grants cannot substitute for disclosure grants |
| AC-06 | One person declines or lets an invitation expire | Their own private explanation is available; partner sees only neutral unavailability, not the private reason or findings |
| AC-07 | Clinician has role but no current case assignment, or purpose mismatches | Deny; administrator role cannot override; minimal audit reason internal only |
| AC-08 | Withdrawal races with assessment/write/display or a stale cached decision | Revocation wins after its authoritative commit; later protected commit/read fails recheck; stale jobs/results suppressed; no promise to erase prior lawful viewing |
| AC-09 | A fictional report is unsupported, corrected or superseded | Mark needs review; invalidate dependent stale explanations/disclosure scope; never silently reuse old result |
| AC-10 | Rules, provenance, qualified reviewer or disease eligibility is missing | No individualized clinical output; needs-review/unavailable state without guessed probability |
| AC-11 | Referral is simulated, pending or fails provider confirmation | Explicit simulated/pending/failed label; never real booked status without evidence |
| AC-12 | Support account opens a case or exports data | Deny clinical access/export; return only permitted operational fields |
| AC-13 | Required sensitive-action audit persistence fails | Action/disclosure fails closed; no payload release; privacy-safe operational alert |
| AC-14 | Language switches, RTL mixed identifiers, keyboard-only or screen reader used | Meaning/order/labels and refusal/withdrawal choices remain equivalent; clinical translation reviewed separately |
| AC-15 | User asks for diagnosis, marriage suitability, reproductive instruction or unapproved risk number | Refuse that output and offer reviewed education/professional navigation without stigma |
| AC-16 | Retrieved item contains malicious instructions, is withdrawn, or attempts clinical-context access | No boundary change/data leakage; only approved current metadata-filtered content or safe abstention |

## Non-functional requirements

| ID | Proposed requirement / evaluation | Unresolved acceptance owner |
|---|---|---|
| NFR-01 | Default deny; resource/purpose checks server-side; negative scenarios AC-03 to AC-08 | Security/privacy leads, APR-04/APR-05 |
| NFR-02 | No sensitive payloads in URLs/logs/analytics/embeddings; restricted audit access | Privacy lead, APR-04; H05/H12 |
| NFR-03 | Versioned consent/content/provenance; no silent stale-result use | Clinical/privacy leads, APR-02/APR-04; H06/H09 |
| NFR-04 | Sensitive requests/outputs not cached by shared clients/CDNs; downloads/exports disabled initially | Security/privacy leads, APR-04/APR-05 |
| NFR-05 | Encryption, key custody, identity/MFA/session policies and approved hosting assessed before runtime | Security/operator, APR-01/APR-03/APR-05 |
| NFR-06 | Proposed accessibility target WCAG 2.2 AA, including Arabic/RTL; independent evaluation required | Accessibility/bilingual reviewers, APR-06; target not certification |
| NFR-07 | Timeouts, idempotent mutations and race-safe authorization; unavailable dependencies fail closed | Engineering/security reviewers; workload/latency/SLO/timeout targets PENDING |
| NFR-08 | Backups, restoration, incident coverage and audit durability have evidence before operation | Operator/security/counsel, APR-03/APR-05/APR-07; retention/RPO/RTO PENDING |
| NFR-09 | Dependency/provider-neutral boundaries; optional future RAG cannot break static education | Engineering/content reviewers, APR-02/APR-06; H12 |
| NFR-10 | Comprehension/referral/privacy/equity metrics use approved denominators and small-group protection; no marriage outcomes | Product/privacy/bilingual reviewers, APR-04/APR-06 |

## Review gaps

No user journey, clinical expectation, legal basis, performance threshold or accessibility target is approved or tested in a runtime. Full P01 requires reviewer validation, lawful-purpose/retention decisions and accepted architecture/permission artifacts; all remain pending. Read [consent](consent-matrix.md), [data flows](data-flows.md), [UX](ux-workflows.md), [threats](threat-model.md) and [API outline](api-outline.md) together before review.
