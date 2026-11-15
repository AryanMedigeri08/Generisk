# ADR-006 — Local fictional identity, consent and transactional audit

2026-11-15, Asia/Calcutta. ACCEPTED for the DEC-010 synthetic hackathon implementation only. Not clinical approval. Supersedes ADR-005's deny-all implementation only within P03.

## Decision and trust boundaries

Use four seeded fictional accounts, Argon2id (64 MiB, three iterations, parallelism two), and an isolated `SessionIdentityProvider` interface backed by opaque server-validated sessions. Store session/invitation token digests, never their raw values; passwords are Argon2id hashes. Rotate the anonymous login challenge into a new authenticated session. Logout revokes it. Browser headers cannot choose identity or role. Counsellor is a fictional label, not a credential verification claim. Support has no private-case bypass.

The Next.js same-origin server proxy allowlists path roots, methods and selected headers. It forwards HttpOnly cookies, never trusted browser role claims. Cookie policy is SameSite=Lax, host-only, Path=/; Secure=false for loopback HTTP, required true for a configured HTTPS loopback origin. Origin checks, a custom request header and session-bound CSRF protect mutations including login. Response/client fetches use no-store. Session and invitation secrets stay out of URLs, telemetry, localStorage and sessionStorage. UI holds CSRF/invitation values in memory only; logout/expiry clears private UI state. Browser traces are disabled for authenticated tests and screenshots mask invitation fields.

## Authorization and scope

Case metadata requires ownership, or fictional counsellor role AND an explicit case assignment AND current owner processing permission. The latter is a deliberately narrow demo shortcut: processing permission covers assigned counsellor synthetic metadata access, explained in the UI. It does not settle P01's eventual professional disclosure design. Public P02 fixture cards remain public invented templates; private ownership/version endpoints are separately protected.

Invitations are recipient-bound, unpredictable, single-use and expire. Recipient must independently sign in and supply the one-time code. A sees only available/unavailable; refusal reasons and partner consent states are never returned. Accepting creates a joint request, not permission. Both current input processing choices and both joint-version assessment grants are required for availability. Disclosure additionally requires both reviewed-output-version grants for the fixed participants audience. Runtime creates no reviewed output and has no review/clinical-generation endpoint; positive disclosure tests explicitly install fixed non-clinical placeholder metadata in the disposable test database. No genetic conclusions are produced or shown.

Each scope has a monotonic decision version, expected-version check, target input/joint/output version and independent state (grant/refuse/withdraw/expire/supersede). Request idempotency keys bind to a payload fingerprint. Replay returns the current state and cannot revive a withdrawn choice. A fictional input-version increment invalidates affected permissions/output review. Withdrawal prevents authorization after its authoritative commit; it cannot erase information already returned before it.

## Consistency and audit

All P03 sensitive reads/mutations take the same PostgreSQL transaction advisory lock `7300301`. This gives a simple total order across sessions, permission changes, disclosure and required audit writes in this four-account demo. There is no authorization cache. A read already serialized before withdrawal may complete; later reads cannot use the old permission. Real lock-waiter tests exercise both orders. Global serialization sacrifices throughput and is unsuitable as an unreviewed production design.

Audit and consent history append in the action transaction. A required audit insertion failure rolls back sensitive state and produces sanitized 503. Expected denials intentionally commit denial evidence and rate/expiry changes. Audit fields are actor, action, purpose, decision, resource/version and time, without request bodies or tokens. Automatic expiry/supersession uses null/system actor, rather than impersonating another participant. Own history includes only one's actor events, limited to 30. PostgreSQL triggers reject UPDATE/DELETE/TRUNCATE on audit and consent-event tables. Database-owner privileges can remove these protections: this is not independent tamper evidence or production immutability.

## Demo timeouts and abuse limits

Authenticated sessions: 1,800 seconds; anonymous challenge: 300; invitations: 600; granted choices: 1,800. Database-backed fixed windows: five login attempts per username, 30 per connecting IP, five invitations per sender, 30 challenges per connecting IP, per 60 seconds. The proxy uses its own connecting IP, so the shared demo has an intentional global IP ceiling; forwarded-IP headers are not trusted. These values are functional demo timeouts, not legally approved retention periods. Expiry is checked at access and persisted lazily. Expired/revoked rows are not automatically purged.

## Alternatives, limits and unresolved dependencies

An external identity stack adds unnecessary hackathon infrastructure; the provider boundary allows replacement later. Browser role switches and universal demo tokens would invalidate negative authorization evidence and are excluded. Fine-grained row locking could scale better, but adds deadlock/race complexity without benefit for four fictional accounts. No parallel clinical implementation is implied.

Public demo credentials, HTTP loopback, a database-owner connection, no MFA/recovery/production account lifecycle, no cleanup schedule, shared rate ceilings, no real professional verification and limited automated accessibility checks are known limitations. Do not expose this stack publicly. Future professional disclosure, hosting, retention, lawful basis, clinical scope and regulatory classification remain unresolved. APR-01–APR-08 PENDING and H01–H12 OPEN, particularly H05/H06/H07 access/privacy/security dependencies; P00/full clinical P01 BLOCKED. This ADR closes none of them. No P04, ingestion, RAG execution, medical rules, integrations or deployment.

## Verification and review

See [P03 evidence](../evidence/p03-validation.md) and [handoff](../../handoffs/P03-to-P04.md) for actual commands/results, SHA and gaps. Assistant engineering review is not human clinical/security certification. P03 remains on its stacked feature branch for review; no merge or automatic P04 advancement.
