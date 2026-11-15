# Arabic, English, accessibility and low-literacy design requirements

**DESIGN-ONLY / NOT APPROVED** | Draft 0.1 | 2026-11-15, Asia/Calcutta

Scope: [DEC-008 amendment v1](DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation). No translated clinical copy, UI or accessibility certification is supplied. P00 and full P01 remain BLOCKED.

## Assumptions and dependencies

Arabic and English are equal product languages, but no bilingual clinical corpus/glossary is approved. Language-specific claims, screening terminology, consent/inference warnings and escalation wording need qualified bilingual clinical review (APR-02/APR-06/APR-07). All H01-H12 remain OPEN, especially H03/H04/H05/H08. Fictional examples contain no actual health information.

## Proposed interaction requirements

| ID | Requirement | Planned evaluation / acceptance observation | Traceability |
|---|---|---|---|
| AL-01 | Offer language selection before sensitive choices; preserve task/state without expanding permission | Repeat own private flow in both languages; no changed scope/grants | APR-04/APR-06; H02/H08; AC-14 |
| AL-02 | Arabic interface uses RTL layout with semantic reading/focus order; mixed-script IDs isolate direction safely | Review screen-reader order, focus sequence, dates and fictional Latin identifiers in RTL | APR-06; H08 |
| AL-03 | Proposed WCAG 2.2 AA target; all actions keyboard-accessible with visible focus and no traps | Independent automated/manual accessibility evaluation in future UI; target is not a compliance claim | APR-06; H08; NFR-06 |
| AL-04 | Semantic headings/landmarks, clear names and error associations; status updates announced without sensitive payloads | Screen-reader review of consent, unavailable, error and withdrawal states | APR-04/APR-06; H05/H08 |
| AL-05 | Adequate visual contrast/zoom/reflow, usable controls; never encode meaning only by color/icon | Inspect typography/zoom/contrast and narrow layouts; numeric thresholds to follow chosen reviewed standard | APR-06; H08 |
| AL-06 | Plain language, short steps, glossary and optional explanation; no pressure to continue | Low-literacy participant walkthrough; refusal and withdrawal as discoverable as acceptance | APR-02/APR-04/APR-06; H03/H04/H08 |
| AL-07 | Teach-back assesses risk versus diagnosis, voluntary choices and joint inference without exposing findings | Qualified bilingual reviewer approves questions/answers/denominators before synthetic study | APR-02/APR-06; H02/H04/H08 |
| AL-08 | Error/recovery paths do not echo health data or reveal partner status; sensitive screen previews minimized | Shared-device/notification/navigation review with fictional accounts | APR-04/APR-05/APR-06; H02/H05/H08 |
| AL-09 | No automatic clinical translation; approval attaches to exact item/source/language/version | Missing Arabic approval returns safe unavailable state or user-selected approved alternative, never silent translation | APR-02/APR-06; H01/H08/H12 |
| AL-10 | Optional audio only with reviewed equivalent content and explicit private playback choice | No autoplay; captions/transcript/equivalent text and privacy review; no recording or voice service selected | APR-04/APR-06; H05/H08 |
| AL-11 | Session expiry/re-authentication preserves privacy and does not covertly resubmit choices | Clear sensitive display; recover safely without granting default permissions | APR-04/APR-05/APR-06; H05/H06/H08 |
| AL-12 | Date/time, language and version labels unambiguous; source and uncertainty accessible | Human review of localized dates, version names, amended and needs-review explanations | APR-02/APR-06; H04/H08/H09 |

## Bilingual content governance proposal

Maintain source-linked content IDs with separate Arabic/English version approval, qualified reviewer identity/role, approved terminology, licensing, review/expiry and withdrawal status. Review consent purpose/audience and inference warnings for equivalent meaning, not literal word substitution. A change to either language or source triggers impact assessment; do not assume the other language remains approved.

Risk is not diagnosis; an absent finding is not universal reassurance; no marriage recommendation, stigma or reproductive directive. Draft English concepts in these documents are not approved patient-facing wording. No Arabic clinical text is invented to fill this gap. Empty/missing/expired content requires a reviewed fallback if available, otherwise safe unavailability and approved professional navigation.

## Planned review matrix

Before human acceptance, cover individual/partner/counsellor/admin flows in Arabic and English; LTR/RTL; keyboard-only and screen reader; narrow/zoomed display; error, timeout and withdrawal; approved and empty knowledge; private/shared devices; and low-literacy comprehension. Reviewers/users and recruitment policy are UNASSIGNED/PENDING. P00's proposed 90% comprehension/navigation targets are proposals requiring reviewer acceptance, not measured outcomes or clinical performance claims.

Record tools/device/browser versions, exact content versions, consent scenarios, defects and reviewer decisions at a commit. Automated accessibility checks cannot replace manual language/assistive-tech/clinical comprehension review. No actual user study, screen-reader run, RTL browser check or accessibility scan was performed in this documentation phase.

## Review gaps

APR-06 approval, current content, glossary, reviewed fallback, keyboard/RTL UI and participant evaluation evidence are absent. APR-04/APR-07 must settle privacy and escalation context. Full P01 remains BLOCKED. Review [requirements](requirements.md), [UX workflows](ux-workflows.md), [consent](consent-matrix.md) and [RAG language filtering](rag-architecture.md).
