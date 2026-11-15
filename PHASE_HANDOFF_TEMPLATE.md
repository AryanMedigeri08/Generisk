# Amanah Genetics — Phase Handoff

> File name: `handoffs/Pxx-to-Pyy.md`  
> Draft until evidence is verified. Do not mark PASS prematurely.

## Metadata
- **Phase / name:**
- **Status:** NOT STARTED | IN PROGRESS | PASS | FAIL | BLOCKED
- **Date and timezone:**
- **Implementer:**
- **Reviewer/approver (role):**
- **Git repository + branch + exact commit SHA:**
- **Environments:**

## 1. Phase objective and original acceptance criteria
- Scope authorized for this phase:
- Acceptance tests defined:

## 2. Work actually completed
| Requirement | Files / endpoints / migrations | Evidence | Result |
|---|---|---|---|
| | | | |

## 3. Architecture and interface changes
- New or changed services/modules:
- API endpoints and OpenAPI diff:
- Data models and migrations (include identifiers):
- Authentication/authorization/consent impact:
- RAG/model/prompt/content versions changed:
- Decisions (`docs/adr/ADR-xxx.md`):

## 4. Commands and observed evidence
```bash
# Paste exact commands that were executed, not hypothetical commands.
```
- CI run URL / local test output:
- Unit/integration/E2E results:
- Lint/type/secret scan results:
- Browser screenshots / staging preview URLs (avoid patient identifiers):

## 5. Required safety assessment
- Sensitive data involved: synthetic only / approved real data (cite approval)
- Privacy: sharing, data minimization, logs, retention and role checks:
- Clinical safety: source approvals, uncertainty, professional escalation:
- Arabic/English & RTL:
- Accessibility:
- Security issues / severity:
- Clinical or compliance sign-off if applicable:

## 6. Known limitations and remaining risks
| Issue | Severity | Impact | Owner | Mitigation / next phase |
|---|---|---|---|---|
| | | | | |

## 7. Gate decision
- **Gate:** PASS | FAIL | BLOCKED
- **Why:**
- **Human acceptance / reviewer:**
- **Blocked from moving to next phase if:**

## 8. Environment handoff
- Prerequisite tools:
- Required `.env` variable NAMES (never secret values):
- Database migration and seed commands:
- Local start command:
- Test command:
- Last verified state and timestamp:

## 9. Specific next-phase instructions
- Next phase and scope:
- Exact files that next implementer should read first:
- Dependencies / high-risk areas:
- Deferred work that should *not* be silently implemented:
- Definition of done:

## 10. Ready-to-paste next-phase prompt
```text
You are implementing Amanah Genetics Pyy. Before editing, inspect the repository,
MASTER_ROADMAP.md, PHASE_HANDOFF_TEMPLATE.md, this completed handoff, ADRs,
and current test state. Verify documented claims against the code. Work only
within Pyy acceptance criteria. Use synthetic data; protect clinical and
personal data. Run checks, report exact observed results, and complete
handoffs/Pyy-to-Pzz.md. Do not claim production clinical readiness.
```
