# Deterministic synthetic report validation

2026-11-16, Asia/Calcutta. P04 structural engineering under DEC-011. **Not clinical validation or medical interpretation.** Full clinical governance remains BLOCKED.

## Stages and safe outcomes

1. Authenticate through P03's opaque session; mutations/read selectors require existing CSRF/origin rules. Resolve actual individual owner and current processing version; professionals/support default-deny report access.
2. Validate bounded fixture reference, expected version and idempotency key. Requests forbid arbitrary document/body fields. Fixture catalog is owner-specific and may be listed before a processing grant because it contains only public fictional template labels.
3. Resolve the identifier through the trusted manifest; match owner/case/action. No arbitrary path, URL fetch or upload. Read at most 16,384 bytes, reject escape/symlink, compare SHA-256. Manifest itself is bounded to 65,536 bytes and 30 entries.
4. Reject duplicate JSON keys, invalid JSON, nesting deeper than eight or more than 200 value nodes. Check explicit schema version before parsing the supported contract. Unsupported versions/extra fields never receive interpretation.
5. Pydantic strict enums/bounds validate required fields, timestamps, sample/owner/case, status, source version, coverage, uniqueness and fictional observation consistency. Numeric boolean substitutions and unrecognized markers/values are rejected. No required data is invented.
6. Confirm manifest/report/sample/authorized case linkage and expected fictional source fields. Missing coverage, uncertain/missing observation values, preliminary status or incomplete included-marker results classify `review_required`.
7. Under the same PostgreSQL transaction, evaluate identical source duplicates, family/version uniqueness, expected input version and exact predecessor/consecutive amendment relation. Invalid amendments cannot mutate an existing source.
8. Append a minimized outcome for malformed/unsupported input. Persist accepted/review-required original/validated source rows and provenance, update active head only for supported current source, and invalidate old P03 input scopes. Append outcome and required audit atomically.

| Category | Stored source revision | Active supported head / meaning |
|---|---|---|
| accepted | Yes, immutable | Latest structurally supported fictional revision; no medical conclusion |
| review_required | Yes, immutable unknowns preserved | No active supported head; non-interpretable review state, no autonomous review/interpretation |
| malformed | No new source | Fixed reason codes only; existing valid records/head unchanged |
| unsupported | No new source | Schema/field unsupported; no fallback inference |
| duplicate | Reuse identical existing source | No new revision/input change, including duplicate of old superseded source; cannot reactivate it |

Source loss, hash mismatch and oversize classify malformed with safe reason codes; manifest integrity/configuration outage returns sanitized 503. Schema/request errors return sanitized 422, unauthorized/missing resources neutral 404, missing own processing 403, stale versions/key conflicts 409, demo rate limit 429. No submitted values, paths, observations, SQL or exception bodies in denials. See [P04 API](p04-api.md).

## Repeats and consistency

Idempotency is actor+key+fingerprinted operation/body. Exact repeat returns its original outcome/reference with the current input version, never repeating a correction; a different payload with that key conflicts. Current permission is still checked before replay. A new key importing identical family/version/hash yields duplicate without making an old version active. Changed source with an occupied family/version is malformed, not an overwrite. Repeated/stale corrections are replayed or rejected safely. All sensitive operations use P03's lock, not cached policy.

Twenty report attempts per actor per 60-second demo window bounds this four-account feature. Session/CSRF/invitation/consent defaults remain P03 values. These timeouts/rates are functional demo settings, not retention/legal approval. Outcomes/history have no automatic purge; real-service use is prohibited.

## Verification and boundaries

Tests exercise all packaged scenarios plus type/byte/depth/key/source-integrity abuse, current processing/cross-user/partner/support/professional denial, expired/forged sessions, CSRF, exact repeats, original preservation, stale head rejection, PostgreSQL migration rollback/re-upgrade and both real correction/withdrawal lock-waiter orders. Required audit failure is injected as an actual PostgreSQL INSERT trigger, verifying whole-transaction rollback. Browser verification uses actual frontend/API/PostgreSQL, import/coverage/provenance/correction, independent partner unavailability, mobile/keyboard/axe and no URL/body telemetry leaks.

Actual counts/failures/CI are in [P04 evidence](evidence/p04-validation.md); tests do not certify security, authenticity, FHIR conformance, genetics, bilingual comprehension or clinical readiness. P00/full clinical P01 BLOCKED, APR-01–APR-08 PENDING, H01–H12 OPEN. Empty KnowledgeProvider and unavailable ClinicalRulesProvider remain; no RAG/LLM/clinical rules or P05.
