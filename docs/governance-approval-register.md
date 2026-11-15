# P00 governance approval register

Version: reconciliation draft 0.1 | Reviewed: 2026-11-15 (Asia/Calcutta)

**P00 gate: BLOCKED.** P01 has not started. This register records evidence requirements and unresolved decisions; it grants no clinical, legal, regulatory or product approval. All reviewer identities and appointment evidence are **UNASSIGNED**. All approval decisions, dates, approval references and expiry/review dates are **PENDING**. No evidence supporting closure was found in the inspected repository or supplied in this task.

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
| APR-08 | Product owner, clinical lead and UAE counsel | P00 artifact/residual-risk acceptance at an exact commit and authorization of full P01 scope | Explicit dated acceptance by each accountable role; exact commit/artifact scope, conditions, unresolved-risk disposition and P01 authorization | PENDING; reviewers UNASSIGNED; approval evidence PENDING | P00 remains BLOCKED; full P01 is not authorized. Proposed DEC-008 would not close this approval |

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

[DEC-008](DECISIONS.md#dec-008--proposed-restricted-p01-design-only-exception) is **PROPOSED, NOT ACCEPTED, INACTIVE**. The request for this reconciliation is permission to draft it only. Product-owner name/authority UNASSIGNED; authorization, date, exact scope/commit and review/expiry conditions PENDING.

The proposed decision would permit only expressly authorized, synthetic-only architecture documentation despite pending P00 human approvals. It would preserve P00 BLOCKED, all unresolved approvals/hazards, the prohibition on application implementation/real data, and independent expert sign-off requirements. It would not authorize full P01 or claim P01 completion. No architecture documents have been created under it.

The decision requiring product-owner authorization is whether to accept that exact restricted exception, including its exclusions and stop conditions. No activation is requested or inferred as part of this P00 reconciliation; a later explicit, evidenced authorization is required before dependent design work.
