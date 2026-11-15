# P00 governance approval register

Version: reconciliation draft 0.1 | Reviewed: 2026-11-15 (Asia/Calcutta)

**DESIGN-ONLY / NOT APPROVED. P00 gate: BLOCKED. Full P01: BLOCKED.** Restricted P01 documentation is authorized only by the separately recorded DEC-008 amendment below. This register grants no clinical, legal or regulatory approval. APR reviewer appointments, professional authority and approval evidence remain **UNASSIGNED / PENDING**. Aryan Medigeri is attributable solely as the self-declared founder/product owner authorizing software documentation; independent identity/authority verification has not been performed. No APR/H closure evidence was supplied.

## Source and reconciliation rules

The [regulatory applicability register](regulatory-applicability.md#approval-and-open-question-register) remains the source of APR-01 through APR-08. The [risk register](risk-register.md) remains the canonical H01-H12 hazard record and severity source. This register adds reviewer/evidence/impact detail without changing either source status. Proposed hazard-to-approval mappings below support review; they are not professional acceptance of a mitigation.

Reviewed baseline: delivery commit `7bb550db16a4645db1358cac722d339b7d992d96`, implementation snapshot `f80c2aed4b6cc394dec5586e17717a78efd6c618`. [Verification evidence](evidence/p00-delivery-verification.md) records observed Git state and validation. Repository inspection cannot rule out decisions held elsewhere; any external approval must be supplied and verified before it can be relied on. No external expert review or fresh legal-currentness assessment was performed in this reconciliation.

## Approval decisions

Every row has named reviewer **UNASSIGNED**, decision **PENDING**, approval evidence **PENDING**, decision date **PENDING**, and review/expiry date **PENDING**. Role titles are requirements, not appointments.

| ID | Required reviewer roles | Approval scope | Supporting evidence required | Current status | Release-blocking impact |
|---|---|---|---|---|---|
| APR-01 | Project sponsor and designated legal operator | Accountable UAE entity, responsibility/liability, professional group and role appointments | Dated entity/appointment evidence; verified accountable representative; documented responsibilities and professional authority | PENDING; reviewers UNASSIGNED; appointment/approval evidence PENDING | Accountable operation and P00 governance acceptance blocked; no clinical service |
| APR-02 | Qualified clinical lead and clinical safety officer/advisor | Intended use, eligible adult population, disease/test scope, exclusions, safety boundaries and clinical oversight | Verified qualifications/appointment; signed scope review of exact artifact commit; hazard review and explicit conditions/residual-risk decisions | PENDING; reviewers UNASSIGNED; approval evidence PENDING | P00 expert gate and individualized clinical claims blocked |
| APR-03 | UAE regulatory counsel and operator | Current applicable instruments, licensure, software/CDS classification, claims and regulatory engagement | Verified counsel appointment; authoritative current texts/implementing decisions; written activity-specific applicability/classification assessment and required permissions | PENDING; reviewers UNASSIGNED; approval evidence PENDING | P00 expert gate, regulatory claims, real-data/clinical release blocked; D02 unresolved |
| APR-04 | Privacy lead, UAE counsel and operator | Lawful purposes; separate processing/joint disclosure and inference risks; rights/retention; hosting, transfers and vendors | Approved purpose/consent/retention decisions and privacy assessment; deployment/access locations; vendor/transfer agreements and permissions where required | PENDING; reviewers UNASSIGNED; approval evidence PENDING | Sensitive-flow design acceptance and real health-information processing blocked; unknowns must remain explicit |
| APR-05 | Security lead, operator and counsel | Current ADHICS applicability/version, assurance responsibilities and security readiness | Current authoritative standard/guideline/applicability materials; accountable owner; applicable-control mapping and verified assurance evidence | PENDING; reviewers UNASSIGNED; approval evidence PENDING | Deployment and real-data release blocked; documentation validation is no control certification |
| APR-06 | Arabic/English clinical-content reviewers and accessibility lead | Clinical wording/terminology, translation equivalence, RTL and accessible comprehension plan/content | Verified reviewer roles; versioned content/source/license approvals; bilingual, comprehension and accessibility evaluation evidence with conditions | PENDING; reviewers UNASSIGNED; approval evidence PENDING | Patient-facing clinical content and bilingual/accessibility readiness claims blocked |
| APR-07 | Operator and qualified clinical lead | Professional credentials, referral arrangements, escalation/incident contacts and coverage | Verified professional scope/credentials; provider agreements; approved referral/escalation pathways, contacts, response commitments and drill evidence | PENDING; reviewers UNASSIGNED; approval evidence PENDING | Real counselling, referrals, booked-appointment claims and operational response commitments blocked |
| APR-08 | Product owner, clinical lead and UAE counsel | P00 artifact/residual-risk acceptance at an exact commit and authorization of full P01 scope | Explicit dated acceptance by each accountable role; exact commit/artifact scope, conditions, unresolved-risk disposition and P01 authorization | PENDING; reviewers UNASSIGNED; approval evidence PENDING | P00 remains BLOCKED; full P01 is not authorized. Restricted DEC-008 does not close this approval |

## Hazard-by-hazard review

All twelve hazards retain **OPEN** status. Likelihood remains UNKNOWN, required owners UNASSIGNED, residual risk unassessed/unaccepted, and closure evidence PENDING. Policy text is evidence of a documented restriction only, not a validated operational control.

| ID | Existing severity / subject | Evidence present and evidence gap | Required reviewer/owner roles | Related approval dependencies | Review outcome / impact |
|---|---|---|---|---|---|
| H01 | Critical — unreviewed/generated interpretation | Intended-use/LLM restrictions present; no approved disease scope, rules/content, independent cases or clinical acceptance | Clinical safety lead | APR-02, APR-06, APR-08 | OPEN; no individualized risk/diagnostic output |
| H02 | Critical — partner disclosure/inference | Independent-choice principle present; no approved joint-result semantics or negative access/inference tests | Privacy lead and clinical lead | APR-02, APR-04 | OPEN; no real joint disclosure |
| H03 | High — marriage labels/coercion | Prohibitions documented; no reviewed journeys/copy or approved coercion pathway | Product owner and safety lead | APR-02, APR-04, APR-06 | OPEN; no marriage recommendation or safety acceptance based on policy alone |
| H04 | Critical — risk confused with diagnosis | Risk/diagnosis boundary present; no approved scope explanations or comprehension evidence | Clinical lead | APR-02, APR-06 | OPEN; no screening reassurance or clinical-performance claim |
| H05 | Critical — public/prompt/log genetic-data leakage | Synthetic-only prohibition and prior limited credential-pattern scan recorded; no approved incident owner or implemented data/access/logging controls | Privacy and security leads | APR-01, APR-04, APR-05 | OPEN; no real health data; pattern scans cannot establish absence of PHI |
| H06 | High — refusal/withdrawal/deletion misrepresented | Future-access/prior-disclosure limitations documented; no lawful retention decision or runtime revocation tests | Privacy lead and counsel | APR-03, APR-04 | OPEN; no claim of enforced consent or deletion |
| H07 | Critical — unapproved jurisdictions/vendors/transfers | Legal/hosting questions identified; no approved entity, locations, vendors or transfer evidence | Operator, counsel and security lead | APR-01, APR-03, APR-04, APR-05 | OPEN; no real processing or deployment |
| H08 | High — translation/RTL/accessibility misunderstanding | Bilingual/accessibility need documented; no approved Arabic copy or runtime/usability evidence | Bilingual clinical and accessibility leads | APR-02, APR-06 | OPEN; no translation equivalence/accessibility assurance |
| H09 | Critical — wrong/stale/ambiguous reports | Provenance/amendment constraints documented; no reports, importer, approved scope or correction tests | Clinical and engineering leads | APR-02, APR-04 | OPEN; no real ingestion or interpretation |
| H10 | Critical — unlicensed operator/professionals/misclassified service | Licensure/classification questions recorded; no legal decision, operator appointment, verified credentials or permissions | Operator and UAE counsel | APR-01, APR-03, APR-07 | OPEN; no clinical/regulatory readiness claim |
| H11 | High — simulated bookings/failed escalation | Simulation distinction and no-response-promise boundary recorded; no provider agreements, live status evidence or coverage pathway | Operator and clinical lead | APR-01, APR-07 | OPEN; no real referral/booked-status/response commitment |
| H12 | High — prompt injection/poisoned or stale retrieval | Approved-content/abstention boundary documented; no corpus, RAG, adversarial tests or access isolation evidence | Security and clinical-content leads | APR-02, APR-04, APR-05, APR-06 | OPEN; no model/RAG execution or safety assurance |

Result: **8 PENDING approvals; 12 OPEN hazards (7 Critical, 5 High); 0 closures; 0 expert sign-offs.** Delivery issues D01 (human governance review missing) and D02 (authoritative legal source gaps) remain unresolved. No new legal conclusion or hazard severity change was made.

## Evidence required before any status change

Record the named reviewer and verified authority/qualification, date/time and timezone, approval ID/scope, exact artifact commit/version, decision and reasons, conditions, evidence location, risk disposition and review/expiry date. Use an approved restricted evidence reference for confidential legal/entity material; do not put personal health information or privileged details into GitHub. A referenced file's existence is not evidence that an authorized person accepted it.

Appointing a person does not itself approve the product. Authoring a policy, running checks, pushing commits or receiving product permission does not close a clinical/legal/security hazard. Rejected, expired or conditional decisions must retain their actual state and restrictions. Any future update must reconcile both the original APR/risk source and this register with supporting evidence; no silent closure.

## DEC-008 authorization boundary

At baseline `9dedc9b87ae30da74171c6aaa63292ed4134baf6`, DEC-008 was PROPOSED / INACTIVE. That historical state and the initial blocked preflight are preserved. The later [amendment v1](DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation) is **ACCEPTED / ACTIVE FOR RESTRICTED DOCUMENTATION ONLY**.

| Activation field | Attributable record and limit |
|---|---|
| Decision maker / basis | Aryan Medigeri, self-declared Founder/product owner; attributable founder statement, not independent identity/authority verification or an operator appointment |
| Source | User's reply to this chat's authorization question; exact question identifier and original text in [authorization evidence](evidence/p01-product-owner-authorization.md) |
| Accepted version | Original DEC-008 at baseline `9dedc9b87ae30da74171c6aaa63292ed4134baf6`, with the expressly accepted expanded documentation scope recorded as amendment v1 |
| Date/time | Author-supplied date 2026-11-15; signing time not supplied; recorded activation 2026-11-15 16:09:00 +05:30 (Asia/Calcutta) |
| Scope / purpose | Eleven draft documentation groups and design-review handoff enumerated in amendment v1, Markdown/static diagrams only; prepare provisional design for review |
| Expiry | Completion of P01 design-only review or 2026-12-15 23:59 IST, whichever occurs first; withdrawal stops work |
| Preserved conditions | P00/full P01 BLOCKED, APR-01 through APR-08 PENDING, H01 through H12 OPEN; fictional data only; no executable implementation, real processing, clinical advice, next phase or merge |
| Scope of verification | Statement content matched against exact baseline/DEC-008 and requested scope/restrictions; attributable self-attestation accepted for project direction only; no external verification or expert sign-off |

This bounded exception satisfies only the project-documentation activation record; it does not satisfy APR-08 or designate any expert reviewer. Full P01 acceptance, implementation, scope expansion and P02 remain unauthorized. No approval or hazard status above is changed. See the original [P00 verification](evidence/p00-delivery-verification.md) for the earlier inactive state; it is not overwritten.
