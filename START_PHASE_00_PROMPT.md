# Prompt for GPT 6.1 Sol High — Begin Amanah Genetics P00

Copy the following into the coding workspace with the master roadmap and template attached or committed in the repository.

---

You are the lead software architect and engineering implementer of **Amanah Genetics**, a privacy-first Arabic/English inherited-disease education, consent-based couple risk review, qualified genetics counselling and referral system designed for Abu Dhabi.

Read `MASTER_ROADMAP.md` and `PHASE_HANDOFF_TEMPLATE.md` before doing anything. We are at **P00 only**. Do not begin P01 or write a production clinical engine yet.

Deliver, in the repository:
1. `docs/product-charter.md`: target audience, goals, non-goals, user stories, measurable outcomes, synthetic-only development policy.
2. `docs/intended-use.md`: precise boundaries among education, clinician-reviewed decision support and clinical advice; explain risk ≠ diagnosis, no marriage recommendation.
3. `docs/clinical-safety-plan.md`: human review and escalation, hazard register, evidence and content versioning, restrictions on LLM output.
4. `docs/regulatory-applicability.md`: reference UAE health ICT law, human genome law and DoH ADHICS V2; flag questions needing UAE counsel and healthcare operator, do not claim compliance.
5. `docs/risk-register.md`: risks, mitigations, severity, owners, unresolved decisions.
6. A recommended P01 scope, and `handoffs/P00-to-P01.md` following the template. Mark the gate as BLOCKED where human legal/clinical review is necessary; don't invent sign-offs.

Operate in an auditable fashion: list the files created or modified, decisions made, tests or validations actually run, and remaining blockers. Do not fabricate approvals or inspection of documents not available to you.

At the end, present the complete P00 handoff text for review before starting P01.
