# Amanah Genetics — Production Build Master Roadmap

**Status:** PLANNING BASELINE — not evidence of a completed implementation.  
**Owner:** Project team.  
**Target market:** Abu Dhabi, UAE.  
**Product intent:** Bilingual, privacy-first inherited-disease risk education, authorized joint review, genetics counselling and referral navigation.  
**Development mode:** Use synthetic data until clinical, privacy, and regulatory authorization for real patient information.  
**Handoff discipline:** No phase is marked complete without reproducible evidence and a signed-off `handoffs/Pxx-to-Pyy.md` file.

## 1. Operating rules for the AI coding assistant

1. Implement **only the current phase** and its acceptance criteria. Do not jump to future phases or claim they are complete.
2. Read `MASTER_ROADMAP.md`, the latest `handoffs/` file, `docs/DECISIONS.md`, and the current repository state before modifying code.
3. Each implementation change must include tests, migrations where applicable, threat considerations, and documentation. Execute checks; never invent test results.
4. No real personal/genetic data, secrets, genomic PDFs, patient results, or identifying logs in source control, public AI prompts, test fixtures or the vector store.
5. Clinical interpretations and numerical risk claims must originate from approved, versioned clinical content or deterministic reviewed logic. A language model must not diagnose, infer pathogenicity, decide whether someone should marry, or make autonomous clinical decisions.
6. In the absence of approved RAG documents, the educational assistant uses approved static content or returns a safe 'knowledge not yet available; consult a professional' response. Never fill a knowledge gap with plausible-sounding clinical claims.
7. Every phase ends with (a) verified artifacts, (b) exact commands and observed results, (c) open issues, (d) an explicit `PASS`, `FAIL`, or `BLOCKED` gate, and (e) the phase handoff to the next phase.
8. **Do not equate code deployed to a server with approval for clinical use.** Clinical go-live requires governance, local legal review, professional sign-off and any necessary regulator/provider permissions.

## 2. Reference architecture and initial decisions

**Application pattern:** modular monolith first; extract services only when justified by operational evidence.  
**Frontend:** Next.js + TypeScript + React, Tailwind, accessible component library, Arabic/English and right-to-left support.  
**Backend:** Python + FastAPI + Pydantic, versioned REST contracts and OpenAPI.  
**Database:** PostgreSQL for application/clinical metadata, consent, records and audits; pgvector enabled but clinical content empty initially. Consider separate database schemas/roles for `app`, `clinical`, `audit`, and `knowledge`.  
**Identity:** OpenID Connect provider (e.g. Keycloak), MFA for clinician/admin accounts, server-side role/relationship/purpose checks.  
**Jobs:** asynchronous worker and a durable queue when needed, not a requirement on day one.  
**Sensitive objects:** encrypted private object storage with narrow retention and access policies, not public buckets.  
**Integration:** adapters for approved FHIR R4-based genomics reporting, initially synthetic sample fixtures; adapters are not claims of hospital connectivity.  
**Clinical decisions:** deterministic, clinician-reviewed rules engine separated from LLM.  
**RAG:** provider-neutral knowledge retrieval interface with in-memory/mock implementation first, then pgvector and approved bilingual documents. RAG holds **approved educational/reference data only**; user data stays behind separate authorized clinical access.  
**Infrastructure:** Docker, Infrastructure-as-Code, GitHub Actions or equivalent CI/CD, private UAE-appropriate hosting for real health data subject to compliance sign-off; centralized monitoring, immutable/append-only sensitive-access auditing, managed secrets and backups.

### Repository recommendation

```text
amanah-genetics/
  apps/web/                 # Patient, counsellor and admin UI
  services/api/             # FastAPI modular monolith
  packages/contracts/       # Shared API and FHIR fixture schemas
  packages/ui/              # Reusable accessible UI
  services/worker/          # Async tasks only when required
  infra/                    # IaC, infrastructure and deployment manifests
  docs/                     # Architecture, policy mapping, clinical safety
  docs/adr/                 # Architecture Decision Records
  handoffs/                 # Signed evidence for completed phases
  data/synthetic/           # Fictional examples only
  tests/                    # E2E, integration, security, clinical fixtures
  .github/workflows/        # CI/CD automation
  README.md
  MASTER_ROADMAP.md
```

### Readiness levels

- **Prototype / demo:** synthetic data, conspicuous non-clinical labeling, stubbed integrations, no diagnosis and no autonomous risk advice.
- **Pre-production candidate:** real security engineering, operational controls, expert review, approved knowledge/clinical rules, documented legal and clinical assurance.
- **Clinical production:** only after all required operator, clinical, privacy, legal, security and local regulatory approvals. No assumption that meeting this roadmap alone confers authorization.

## 3. Phases, deliverables and phase gates

### P00 — Product charter, intended use and clinical/legal constraints
**Build / decide:** Detailed use case, user/persona map; distinguish education, clinician-reviewed risk information and clinical advice; select MVP scope; identify clinical safety officer/advisor, regulatory counsel and designated operator; product boundaries and high-risk scenarios. Draft risk register and regulatory applicability matrix, including UAE genome law, health ICT law and DoH ADHICS V2.  
**Artifacts:** `docs/product-charter.md`, `docs/intended-use.md`, `docs/clinical-safety-plan.md`, `docs/regulatory-applicability.md`, `docs/risk-register.md`.  
**Gate:** explicit intended-use statement, no inappropriate marriage-compatibility binary labels, synthetic-only policy, unresolved approvals logged.  
**Handoff:** `handoffs/P00-to-P01.md`.

### P01 — Functional requirements, UX workflows, architecture and threat model
**Build / decide:** user stories and acceptance tests; service blueprint for individual, partner, counsellor, admin; separate consent for processing vs joint disclosure; data inventory, trust boundaries, threat model, permission matrix, API outline, ADRs; language and accessibility requirements; risk escalation policy.  
**Artifacts:** `docs/requirements.md`, `docs/consent-matrix.md`, `docs/threat-model.md`, `docs/data-flows.md`, `docs/architecture.md`, initial OpenAPI contract, ADRs.  
**Gate:** every sensitive data flow has lawful purpose, authorization check, data owner and retention decision; journeys validated with reviewers.  
**Handoff:** `handoffs/P01-to-P02.md`.

### P02 — Repository foundation, schemas, CI and deployment skeleton
**Build:** Next.js app, FastAPI app, PostgreSQL migrations, Docker Compose for development, seed synthetic fixtures, env configuration, linter, formatting/type checks, unit/integration test harness, basic tracing/metrics, error handling, pre-commit secret scanning, CI checks and deploy-only-to-nonproduction preview. Define a `KnowledgeProvider` interface and `ClinicalRulesProvider` interface with safe placeholders.  
**Artifacts:** running local app, README, `.env.example`, migrations, CI workflow, `docs/local-development.md`, `docs/testing-strategy.md`.  
**Gate:** one-command documented local startup; CI green; default-deny routes; no secrets/PHI committed; missing RAG does not break app.  
**Handoff:** `handoffs/P02-to-P03.md`.

### P03 — Identity, role/purpose authorization, independent consent and audit
**Build:** OIDC login, protected patient identity, strong clinician/admin auth, role + resource + purpose checks server-side, session handling, consent request/grant/refuse/withdraw/version, partner invitation without silent linkage, restricted access and audit events. Revocation blocks future processing/access; do not promise removal of material already lawfully viewed.  
**Artifacts:** consent state machine, authorization policy, audit schema, API tests, threat-based negative tests, privacy UX copy.  
**Gate:** unauthorized cross-patient access, consent bypass, IDOR and revoked permission attempts blocked in automated tests.  
**Handoff:** `handoffs/P03-to-P04.md`.

### P04 — Clinical data schema, report ingestion and provenance
**Build:** synthetic FHIR-style genomic report importer and normalized records; verify expected data fields, evidence/source, test coverage, report statuses, report corrections and uncertainty; versioned parser and validation; private file/record access. No real lab integration without agreements.  
**Artifacts:** synthetic example reports, schema mappings, import API, import error handling, validation tests, `docs/report-provenance.md`.  
**Gate:** malformed/ambiguous reports rejected or marked 'needs clinical review'; audit and provenance preserved; unsupported input not silently accepted.  
**Handoff:** `handoffs/P04-to-P05.md`.

### P05 — Clinician-reviewed genetics rules and explanation contracts
**Build:** clinician-approved demonstration rules for narrowly scoped recessive inheritance cases; variant evidence metadata and review state; uncertainty/exclusion rules; explicit separation of screening risk vs diagnosis; escalation flags; versioned explanation output that AI cannot override. No universal gene-name matching or unsupervised pathogenicity prediction.  
**Artifacts:** `docs/clinical-rules-spec.md`, synthetic case library (positive, negative, ambiguous, amended), independent expected-outcome tests, review workflow.  
**Gate:** all gold-standard synthetic cases pass; uncertain cases escalate safely; formal clinical sign-off required before medical claims in real-world use.  
**Handoff:** `handoffs/P05-to-P06.md`.

### P06 — Bilingual patient experience and comprehension
**Build:** dashboard, report-summary cards, consent screens, Arabic RTL + English, plain-language educational templates, optional audio with privacy-safe playback, teach-back assessment, screen-reader/keyboard access, low-literacy options. Initial education works without RAG.  
**Artifacts:** tested patient journeys, reviewed copy, i18n glossary, accessibility audit, comprehension question bank.  
**Gate:** no coercive wording; keyboard/RTL flows pass; comprehension answers do not expose partner records; reviewed educational material only.  
**Handoff:** `handoffs/P06-to-P07.md`.

### P07 — Counsellor and referral portal
**Build:** clinician case queue, scoped case access with explicit authorizations, case review, reason-for-referral, appointment request and status flow, review and correction actions, patient-facing status updates. Initially simulate providers and appointments.  
**Artifacts:** role-safe counsellor UI, referral state machine, synthetic fixtures, activity and error logs, E2E tests.  
**Gate:** no unauthorized clinician access; high-impact/ambiguous cases cannot bypass professional review; 'booked' state only for verified or explicitly simulated bookings.  
**Handoff:** `handoffs/P07-to-P08.md`.

### P08 — Curated bilingual RAG and AI education (content can be populated later)
**Build:** knowledge ingestion pipeline (source/licensing/provenance/version, clinical approval, content chunking, embeddings), pgvector retrieval, multilingual question routing, source citation, output safety controls and human escalation. Keep authorization boundaries: no PHI in embeddings; any patient context comes from separately authorized runtime access.  
**Artifacts:** `docs/rag-content-policy.md`, `docs/rag-eval-plan.md`, embeddings/review schema, source update job, evaluation dataset, prompt-injection checks, hallucination/abstention test results.  
**Gate:** only reviewed current content served; safe abstention with empty/missing retrieval; Arabic/English tests passed; no personalized clinical advice from LLM. **Can be postponed if shipping a static-content-only prototype.**  
**Handoff:** `handoffs/P08-to-P09.md`.

### P09 — Admin operations and privacy-preserving metrics
**Build:** administrative process tools without default access to clinical details; service KPIs (completion, understanding, time to referral, privacy violations, equity across languages); small-group suppression; opt-in and purpose controls for any research/analytics data.  
**Artifacts:** metrics data dictionary, dashboard, test fixtures, logging/redaction policy, audit review workflows.  
**Gate:** no raw genetic/identifying records in aggregate dashboards; valid denominators and metric definitions; metrics do not treat marriage outcomes as success.  
**Handoff:** `handoffs/P09-to-P10.md`.

### P10 — Full functional, clinical and AI safety verification
**Test:** unit, integration, API contract, database migration, E2E, concurrency, accessibility, bilingual quality, clinical synthetic gold set, negative access controls, consent withdrawal, tampered report, AI retrieval failures, prompt injection, RAG poisoning, regression and performance.  
**Artifacts:** traceable test matrix, coverage and CI evidence, defects and severity, clinical review report, model/RAG evaluation results, reproducible commands.  
**Gate:** zero unresolved release-blocking defects; documented thresholds met; independent review of clinically sensitive flows.  
**Handoff:** `handoffs/P10-to-P11.md`.

### P11 — Security, privacy, regulatory and clinical assurance
**Assess:** external or independent pentest, threat model closure, DPIA/PIA, secure processing and hosting, key/secret rotation, retention, legal terms, consent wording, clinical quality system, approved educational sources, incident response and hazard mitigations. Map applicable controls to current DoH ADHICS and federal requirements. Determine whether medical-device/clinical decision-support regulation applies based on intended use.  
**Artifacts:** control/evidence matrix, security reports, privacy assessment, professional sign-offs, approval register, residual-risk acceptance.  
**Gate:** no clinical deployment if statutory approvals, hosting requirements, operator responsibilities, liability or clinical safety are unresolved.  
**Handoff:** `handoffs/P11-to-P12.md`.

### P12 — Infrastructure, staging release, operations readiness
**Build:** protected UAE-appropriate hosting as determined by counsel, private networks, encrypted backups, CI/CD signed artifacts, vulnerability scanning, approval gates, staging environment, release/rollback runbooks, observability, alerts, uptime indicators, disaster recovery and backup restoration tests. Provision real integrations only through authorized agreements.  
**Artifacts:** IaC, deployment workflows, architecture diagram, incident and DR playbooks, staging test report, deployment evidence and SLOs.  
**Gate:** reproducible staging rollout, rollback drill, backup restore drill and on-call ownership; clinical use not assumed by staging success.  
**Handoff:** `handoffs/P12-to-P13.md`.

### P13 — Authorized pilot, production cutover and lifecycle governance
**Operate:** supervised rollout with qualified providers and required permissions; informed participant onboarding; measured comprehension/referral/privacy/equity; clinician review; incident monitoring, feedback, phased feature flags, periodic evidence and source updates, ongoing audits and revalidation when clinical logic/LLM/RAG changes.  
**Artifacts:** pilot protocol and approval, go/no-go record, rollout checklist, clinical support SOP, post-launch monitoring, change-management register, `docs/operations-runbook.md`.  
**Gate:** formally authorized launch and controlled increase in exposure; unresolved critical safety findings block scaling.  
**Handoff:** `handoffs/P13-to-OPERATIONS.md` with an ongoing release/incident/assurance schedule.

## 4. Cross-cutting test matrix (required continuously, not only P10)

| Category | Minimum verification |
|---|---|
| Functional correctness | Unit/API/integration/E2E tests for every change; migrations reversible where possible |
| Privacy and authorization | Cross-account denial, purpose limitations, denied/withdrawn consent, partner-level inference tests, secure logging |
| Clinical content | Reviewed references, provenance, strict uncertainty handling and escalation; no unsupported numerical claims |
| RAG/AI | Retrieval relevance, groundedness, citations, Arabic/English equivalence, no unauthorized PHI, prompt-injection resistance, abstention |
| Localization/accessibility | RTL navigation, semantic labels, screen readers, keyboard, understandable Arabic/English |
| Reliability | Parallel update behavior, idempotent requests, queues/retries, backup restore, rollback, alerts |
| Cybersecurity | Dependency and secret scans, SAST/DAST, pentest before real deployment, vulnerability response |
| Governance | Approval evidence, control matrix, audit trail, release owner, revision history |

## 5. Handoff protocol

For every phase: create `handoffs/Pxx-to-Pyy.md` using `PHASE_HANDOFF_TEMPLATE.md`. The file is **a completion report**, not just a to-do list.

Required fields:

1. Phase ID and status (`PASS`, `FAIL`, or `BLOCKED`), dated and reviewer/approver.
2. Stated intended scope and what was actually implemented.
3. Exact commit SHA, changed files, schema migrations, API contracts, infrastructure changes.
4. Commands run, observed results, screenshots/CI logs or artifact paths, test counts.
5. Security, clinical safety, data privacy, Arabic localization and accessibility checks.
6. Deferred items, blocked dependencies, technical debt and residual risks.
7. Decisions taken, ADR links, exact current environment and seed requirements.
8. Next-phase prerequisites, explicit safe continuation prompt, and stop conditions.

**Do not mark a phase PASS based only on an AI-generated summary.** Capture test evidence from the actual repository, and request human expert sign-off where required.

## 6. Decisions needed before involving real patients

- Who is the legally accountable clinical/operator entity in the UAE?
- What is the clinically claimed intended use, exact disease/test scope and qualified reviewer group?
- Which laws, DoH rules and permissions apply to the planned deployments and integrations?
- Which UAE-based hosting, access, archival, breach response and data transfer practices are approved?
- What are the consent semantics for private/joint findings including what the partner may infer?
- Which qualified professionals are able to review genetic findings and offer counselling?
- Who clinically approves bilingual educational content, rules updates and automated explanations?

Until these are answered, use a simulated, clearly labeled demonstration system.

## 7. Official baseline reference links to assess with experts

- DoH AAMEN / ADHICS V2: https://www.doh.gov.ae/en/programs-initiatives/aamen
- UAE ICT in health-sector laws: https://u.ae/en/about-the-uae/digital-uae/whole-of-government-approach/digital-health/ict-in-the-health-sector
- Federal Decree-Law No. 49 of 2023, Human Genome: https://uaelegislation.gov.ae/en/legislations/2195
- HL7 Genomics Reporting IG v3.0.0 (FHIR R4): https://hl7.org/fhir/uv/genomics-reporting/

These are planning references, not a legal compliance certification. Check whether any standard has been superseded before real go-live.
