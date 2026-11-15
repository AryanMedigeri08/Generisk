# Product charter

Version: P00 draft 0.1 | Date: 2026-11-15 (Asia/Calcutta) | Approval: NOT APPROVED

## Problem and intended audience

Amanah Genetics is proposed for Abu Dhabi residents who need understandable Arabic/English inherited-disease education and help navigating qualified genetics counselling. Genetic information can affect relatives and partners and can create stigma or coercion. The product must preserve individual choice, uncertainty and privacy.

The initial audience is adults able to make an independent decision about participating. The operator must obtain legal/clinical advice on eligibility and decision-making capacity before any real enrollment. Minors, substitute decision-making and research participation are excluded from the proposed MVP pending separate policy and authorization.

## Goals and measurable outcomes

These are proposed acceptance targets for later synthetic evaluations, not measured outcomes or clinical performance claims.

| Goal | Proposed measure and denominator | Initial target / review |
|---|---|---|
| Understand boundaries | Participants correctly distinguish risk from diagnosis and education from advice / all synthetic usability participants answering each question | At least 90% per language; clinical and UX reviewers must approve questions and targets |
| Preserve choice | Correct refusal/withdrawal outcomes / all scripted refusal/withdrawal scenarios | 100%; no automatic partner linkage or penalty for refusing |
| Prevent disclosure | Unauthorized disclosures / all defined negative authorization scenarios | Zero; later verified through threat-based tests |
| Navigate support | Participants locating a qualified-help route / all synthetic usability participants attempting it | At least 90% per language; operator must approve provider criteria |
| Communicate uncertainty | Unsupported/ambiguous synthetic cases routed to review / all such evaluation cases | 100%; no automatic reassurance |

Do not measure success by marriage decisions, matching rates, number of genetic disclosures or pressure to accept screening. Small-group reporting must avoid identifying participants; detailed metric design belongs to later phases.

## User/persona map and representative use cases

These are product scenarios, not the P01 requirements or acceptance-test specification.

| Persona | Need and representative story | Boundary |
|---|---|---|
| Individual participant | As an adult, I want private education in my chosen language so I can prepare questions for a professional | No diagnosis or inferred partner findings |
| Invited partner | As an invited adult, I want to refuse or independently authorize a defined joint review | An invitation is not consent; processing permission is separate from joint disclosure |
| Qualified genetics professional | As an authorized reviewer, I want provenance and uncertainty before communicating reviewed information | Registration alone gives no access; real credentials and scope require verification |
| Operator/support administrator | As support staff, I want to resolve navigation issues without seeing genetic findings | Administrative role does not grant clinical access |
| Clinical safety advisor | As the safety lead, I want to halt unsafe claims or a release | Role currently unassigned; no safety acceptance may be inferred |
| Privacy/security lead and counsel | As reviewers, we need accountable purposes, processing locations and evidence | Roles currently unassigned; advice and control review remain pending |

## Proposed MVP selection

Prioritize bilingual educational navigation, independent consent concepts, a simulated authorized joint-review journey, professional-review status and simulated referral navigation. Use approved static educational content when available; otherwise clearly abstain and direct the person to a qualified professional. The content corpus is currently empty and unapproved.

Any future numerical risk information requires a narrowly defined disease/test scope, approved versioned deterministic rules and professional review. That capability is not part of P00 and is disabled by policy until later gates. No disease or test panel is selected in P00.

## Non-goals and product boundaries

No diagnosis, treatment, variant pathogenicity prediction, marriage recommendation, binary marriage-compatibility score, reproductive directive, universal gene matching, emergency service, direct-to-consumer screening, real lab integration, research reuse or production deployment. The product does not replace mandated screening, a clinician or a regulator. Do not use genetic traits for employment, insurance, family selection or social ranking.

## Synthetic-only development policy

Use wholly invented scenarios created without real records. De-identified or pseudonymized patient data is not treated as synthetic. Do not copy actual reports, identifiers, family trees, genomic PDFs, DNA sequences or clinical conversations into the repository, AI prompts, embeddings, logs or issue trackers. No participant recruitment or real data collection is authorized.

Public GitHub material must contain documentation and fictional examples only. If real data is received accidentally, stop handling it, restrict access, notify the designated privacy/operator contact through an approved channel and follow incident procedures; do not reproduce it in an issue or commit. Because those contacts and procedures are not yet approved, real-data channels must remain closed.

## Accountable ownership and delivery boundary

The designated legal operator, clinical safety officer/advisor, qualified reviewer group, regulatory counsel, privacy lead, security lead and bilingual clinical-content reviewer are **UNASSIGNED**. The project sponsor must appoint them; no names or credentials are invented. See [the approval register](regulatory-applicability.md#approval-and-open-question-register).

P00 delivers these decisions as drafts and a blocked handoff. [Intended use](intended-use.md), [safety planning](clinical-safety-plan.md) and [risks](risk-register.md) constrain all later work. P01 is recommended next only after its prerequisites are reviewed and explicitly authorized; no workflows, architecture or code are implemented here.
