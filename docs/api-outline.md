# Conceptual API outline

**DESIGN-ONLY / NOT APPROVED** | Draft 0.1 | 2026-11-15, Asia/Calcutta

Scope: [DEC-008 amendment v1](DECISIONS.md#dec-008-amendment-v1--restricted-documentation-activation). **Markdown concepts only: no executable OpenAPI, schema, endpoint, service or client is created.** All route names below are proposals for later separately authorized phases. P00 and full P01 remain BLOCKED.

## Assumptions and dependencies

Future versioned REST boundary with authenticated identity and server-side default deny. Exact payload fields/types, legal purposes, session design, disease scope and error text are not approved (APR-01/APR-02/APR-03/APR-04/APR-05/APR-06/APR-07). All H01-H12 remain OPEN. See [permissions](consent-matrix.md), [flows](data-flows.md) and [requirements](requirements.md).

## Proposed endpoint responsibilities and scopes

The `/v1` prefix is a naming proposal. Processing permissions never substitute for resource ownership, assignment, purpose or separate disclosure. No patient/genetic data or tokens belong in query strings. Mutations need approved anti-replay/CSRF protections according to the eventual session design.

| Conceptual method/path | Purpose / minimum conceptual information | Proposed access scope and state | Traceability |
|---|---|---|---|
| GET `/v1/education` | Approved current language-specific general items/source versions | General education only; content approval/currentness gate; no patient context | APR-02/APR-06; H01/H08/H12; FR-01/FR-02 |
| GET `/v1/me` | Own minimized account/language preferences | Authenticated subject; no clinical or partner metadata | APR-04/APR-05; H05; FR-03 |
| GET `/v1/cases/{caseId}` | Permitted private provenance/review status | Subject owns case or assigned qualified professional with permitted purpose; admin denied | APR-02/APR-04/APR-07; H02/H05/H09; FR-07 |
| POST `/v1/invitations` | Minimal counterpart invitation request, no findings | Own permitted case; abuse policy/recipient verification; no clinical linkage by creation | APR-04/APR-05; H02/H03; FR-04 |
| POST `/v1/invitations/{invitationId}/accept` | Independently confirm intended recipient | Authenticated intended recipient plus unused/unexpired bound proof; cannot grant processing automatically | APR-04/APR-05; H02/H06; FR-04/FR-05 |
| GET `/v1/me/permissions` | Own scope/version/history only | Owner only; no counterpart refusal reasons | APR-04; H02/H06; FR-05/FR-06 |
| POST `/v1/me/permissions` | Own affirmative grant/refusal for exact purpose/audience/version | Owner, reviewed scope and current expected version; no on-behalf-of grant | APR-02/APR-04; H02/H03/H06; FR-05 |
| POST `/v1/me/permissions/{permissionId}/withdraw` | Withdraw own future scoped permission | Owner; atomic version advance; idempotent repeat; recheck dependent access | APR-04/APR-05; H06; FR-08 |
| POST `/v1/assessments` | Request exact pair/input-version assessment | Both processing and assessment grants current, eligible inputs, approved rules/scope; assigned purpose where professional | APR-02/APR-03/APR-04; H01/H02/H04/H09; FR-10 |
| GET `/v1/assessments/{assessmentId}` | Minimal permitted status or reviewed result | Status cannot leak private reason; result requires qualified review and both scoped disclosure grants for exact output/audience | APR-02/APR-04/APR-07; H02/H06/H09; FR-11 |
| POST `/v1/cases/{caseId}/correction-requests` | Record a request to review an input correction | Own/assigned authorized case; does not amend an approved report automatically | APR-02/APR-04/APR-07; H09; FR-09 |
| POST `/v1/reviews/{reviewId}/decisions` | Attributable professional review/version transition | Verified qualified reviewer, current assignment/purpose and supported state; cannot bypass disclosure | APR-02/APR-04/APR-07; H01/H09/H10; FR-10/FR-11 |
| POST `/v1/referral-requests` | Own/assigned scoped request and explicitly simulated status | Approved purpose/fields; no real provider call or booked claim until separate approvals | APR-01/APR-04/APR-07; H10/H11; FR-12 |
| GET `/v1/support/tasks` | Minimized operational routing | Support-purpose role only; no clinical findings, relationship inference or private refusal | APR-04/APR-05; H02/H05; FR-13 |
| GET `/v1/audit/events` | Restricted sensitive-decision evidence | Explicit audit-review scope and purpose; not general administrator access | APR-03/APR-04/APR-05; H05/H06; FR-14 |

Actual report upload/objects, clinician credential provisioning, education ingestion, admin role management and external callbacks need later dedicated design/approval. They are not implemented or silently exposed here. No arbitrary clinical query endpoint, partner lookup by public identifier, public object URL or bulk export is proposed.

## Conceptual error and status semantics

| Proposed condition | External behavior | Internal/audit behavior |
|---|---|---|
| Missing/invalid session | Authentication required; no protected metadata | Minimized reason, no credential values |
| Cross-person unknown/unauthorized resource | Same non-enumerating not-found/unavailable representation; do not distinguish existence | Record precise restricted denial reason without findings |
| Own scope missing/withdrawn | Privately explain own needed choice; counterpart receives neutral unavailable state | Purpose/version identifiers in restricted audit only |
| Invalid shape/unsupported value | Validation failure without echoing sensitive input | No raw body/log; approved validation metadata only |
| Stale consent/output revision or mutation conflict | Conflict; require refresh/new scope confirmation | Preserve version/provenance; never retry into broader permission |
| Review/content/rules not ready | Needs-review or unavailable state, no clinical output | Record internal dependency state with scoped access |
| Replayed/expired invitation | Generic invitation unavailable | Abuse monitoring with minimal data; no recipient/case enumeration |
| Rate limit | Generic retry guidance with no private state | Approved threshold/retention PENDING |
| Identity/policy/audit/storage dependency fails | Unavailable; no sensitive success or stale disclosure | Privacy-safe alert; required audit/commit fails closed |

Exact HTTP codes, user copy, correlation-ID format and response timing thresholds require contract/security/UX review. A conventional 401/404/409/422/429/503 mapping is a proposal, not an executable contract. Error shape and timing must be tested for enumeration/inference, not assumed safe because text is generic (H02/H05).

## Consistency, idempotency and response handling

Mutating requests should bind an idempotency reference to actor, purpose and request scope; reusing it with changed scope must fail. Repeated withdrawal returns the actual withdrawn state without duplicating effects. An idempotency key cannot preserve authorization after withdrawal. Authorization/consent/resource versions are checked at the protected commit/read; stale cached decisions are never sufficient. Sensitive payload responses are private/noncacheable, minimized and excluded from telemetry.

Review decisions and disclosure are separate transitions. Approved content/rules/input versions and audience grants must still be current on later reads; a historical review is no perpetual entitlement. Output supersession prevents stale results from appearing current. All behavior needs later negative, replay, race and dependency-failure tests.

## Review gaps

No endpoint tests, auth service, API schema validation, rate limiting, idempotency store or security control exists. Counsel/privacy decisions and clinician assignments remain unapproved. This Markdown outline deliberately leaves executable contracts for separate authorization and cannot pass the full P01 gate. Review [threats](threat-model.md) and [ADR-002](adr/ADR-002-consent-authorization.md).
