# Product, safety and governance risk register

Version: P00 draft 0.1 | Date: 2026-11-15 (Asia/Calcutta) | Residual-risk acceptance: NONE

## Method and ownership

Critical = plausible severe clinical harm, major genetic disclosure or operation without required authorization. High = material harm to choice, care, confidentiality or comprehension. Moderate = material planning/traceability limitation without current patient exposure. Likelihood is UNKNOWN because there is no running system or exposure study. Priorities are precautionary, not quantitative risk scores.

All hazards below are **OPEN**. Proposed controls are unimplemented unless explicitly described as a documented P00 restriction. Residual risk is unassessed and unaccepted. Each owner is a required role, currently **UNASSIGNED**; the project sponsor must appoint individuals. No actual breach or patient incident is reported by this register.

| ID | Hazard / cause and possible consequence | Severity / likelihood | Owner (unassigned) | Proposed mitigation / verification and phase | Status / unresolved decision |
|---|---|---|---|---|---|
| H01 | Generated or unreviewed interpretation causes false reassurance, distress or inappropriate care decisions | Critical / unknown | Clinical safety lead | P00 prohibits diagnosis/unsupported numbers; P05/P08 require versioned approved rules/content and independent case/abstention tests | OPEN; disease/test scope and reviewers unknown |
| H02 | Silent partner linkage or inferred shared finding reveals another person's genetic information | Critical / unknown | Privacy lead / clinical lead | P01 define independent processing/disclosure choices and inference warnings; P03 negative authorization/revocation tests | OPEN; joint findings, lawful basis and retention undecided |
| H03 | Binary marriage labels or coercive presentation creates stigma or relationship pressure | High / unknown | Product owner / safety lead | P00 prohibits marriage recommendations and compatibility binary labels; P01/P06 review flows and copy with independent users | OPEN; coercion pathway and reviewers needed |
| H04 | Limited screening treated as diagnosis or absence of all disease risk | Critical / unknown | Clinical lead | P00 states risk is not diagnosis; P05/P06 enforce scope/uncertainty explanations and comprehension checks | OPEN; approved claims/content absent |
| H05 | Real reports, identifiers or family data enter public GitHub, logs, AI prompts or embeddings | Critical / unknown | Privacy / security leads | P00 synthetic-only policy and no data ingestion; later minimization, scanning, logging restrictions and separate authorized access | OPEN; incident owner and approved tool/data boundaries absent |
| H06 | Refusal or withdrawal ignored, or deletion promised despite prior disclosure/retention duty | High / unknown | Privacy lead / counsel | P01 distinguish choices and retention; P03 revoke future access; P10 test state/race/denial scenarios | OPEN; lawful retention and shared-result semantics unresolved |
| H07 | Wrong jurisdiction, vendors or transfers expose health/genetic data or breach obligations | Critical / unknown | Operator / counsel / security lead | Resolve REG-01 through REG-04 before real data; later provider due diligence and control evidence | OPEN; geography, access, operator and vendor approval absent |
| H08 | Unreviewed Arabic, poor RTL or inaccessible flow changes meaning or impairs consent | High / unknown | Bilingual clinical / accessibility leads | P01 language/accessibility requirements; P06 specialist translation and keyboard/screen-reader/comprehension evaluation | OPEN; no Arabic clinical copy approved |
| H09 | Incomplete, mismatched, ambiguous or amended report produces stale or wrong output | Critical / unknown | Clinical lead / engineering lead | P04 provenance and correction workflow; P05 independent expectations, exclusion and escalation tests | OPEN; report sources/test coverage not selected |
| H10 | Unlicensed operator/professional, misleading claims or misclassified software results in unsafe service | Critical / unknown | Operator / UAE counsel | APR-01/APR-03/APR-07 evidence and current legal classification before service; P11 independent assurance | OPEN; all legal/operator designations pending |
| H11 | Simulated referral appears booked, or urgent need has no qualified escalation route | High / unknown | Operator / clinical lead | Explicit simulation labels in later prototype; P07 verified status transitions; approve coverage and emergency navigation before real use | OPEN; providers and response commitments absent |
| H12 | Prompt injection or poisoned/stale retrieval changes boundaries or leaks clinical context | High / unknown | Security / clinical-content leads | P08 approved ingestion, version/expiry checks, distrust retrieved instructions, empty-RAG fallback and adversarial evaluation | OPEN; no RAG or approved corpus exists |

## Delivery issues distinct from clinical hazards

| ID | Issue | Severity | Owner | Required next action / status |
|---|---|---|---|---|
| D01 | P00 lacks required human clinical/legal/operator review | High | Project sponsor | Appoint reviewers, obtain scoped decisions APR-01 to APR-08; BLOCKED gate remains |
| D02 | Official full-text source retrieval unavailable during P00 | Moderate | UAE counsel | Obtain authoritative current Arabic/consolidated texts and ADHICS materials; close source gaps before applicability approval |

## Review and acceptance procedure

At each phase and any incident or scope change, link new hazards, controls, test evidence and residual-risk decisions to the implementation commit. Only designated qualified owners may accept relevant residual risk with reasons, conditions and a review date. Critical/high-impact hazards cannot be silently deferred into clinical release. No hazard is closed merely because a policy or automated document check exists.

See [intended use](intended-use.md), [safety plan](clinical-safety-plan.md) and [approval register](regulatory-applicability.md#approval-and-open-question-register). The P00 [handoff](../handoffs/P00-to-P01.md) reports delivery evidence and the blocked gate.
