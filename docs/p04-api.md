# P04 fixture-only report API

2026-11-16, Asia/Calcutta. Synthetic Genetic Report — Demonstration Only — Not Medical Advice. Scope DEC-011, [storage ADR](adr/ADR-007-synthetic-report-storage.md), [schema](report-schema.md), [validation](report-validation.md).

API prefix `/api/v1/reports`. Existing same-origin `/api/p03/reports` proxy is reused; its name describes the transport origin, not a separate identity system. Server validates opaque P03 session, role, actual owner/case, purpose, current processing/version and required audit in P03's PostgreSQL transaction. Forged role/identity headers never authorize. All POSTs, including read selectors, require existing session-bound CSRF/Origin/custom-header checks. GET proxy requests require X-Demo-Request. Responses are no-store.

Report/case/source identifiers, observation data and hashes are never URL/query selectors. Opaque report/revision handles travel only in POST JSON. There is no generic upload, unrestricted raw export/download, external URL, object-storage or staff report endpoint.

| Method and relative path | Body / response / permission |
|---|---|
| GET `/fixtures` | Authenticated individual; own allowlisted fixture labels/IDs, action, expected scenario. No file paths/hashes/content/other-owner fixtures. Does not require processing to preview fictional choices |
| GET empty path | Own report families/versions/provenance metadata; current processing required |
| POST `/import` | fixture_id, expected_input_version, idempotency_key; own allowed initial fixture and current processing; structured receipt |
| POST `/amend` | Above plus report_handle, expected_revision; own family, allowed predefined amendment/exact predecessor, current processing; receipt |
| POST `/view` | report_handle, optional revision_handle; current processing AND own family/nested revision; structured bounded fictional fields and revision provenance |
| POST `/versions`, `/provenance` | Same selector shape; own metadata/history; current processing required |
| GET `/history` | Latest 30 own import/amend outcomes; current processing required; category/time/action/fixture and safe references, no request keys or other user's history |

Fixture ID is a bounded `fixture-` enum-like allowlist reference, not a path. Selectors are 36-character opaque server handles; knowledge of a handle grants nothing. Initial expected version is read from existing own case metadata. Idempotency key is 8–64 alphanumeric/hyphen characters. Extra owner/role/report-content fields are rejected. The fixture manifest and typed contracts define the deliberately finite demonstration inputs.

Receipt: outcome_handle, category, fixed reason_codes, optional report/revision handles, input_version_after, current_input_version, replayed, synthetic_only=true, clinical_interpretation=false. Persisted import/correction increments input version and supersedes old grants; receipt contains no observations. Refresh private state and independently grant current processing to view again. Unsupported/malformed/duplicate outcomes do not change the input version.

Report metadata includes source family ID, active revision handle, source-revision IDs/version/state/validation state, predecessor/reason, source digest, fixture/importer and import/validation timestamps. `/view` returns the fictional supported contract; review-required/old versions are explicitly labelled and never current clinical results. Original source bytes are internal only. Source digest is repository integrity, not a lab signature.

Status/errors use existing P02/P03 sanitized envelopes: 401 unauthenticated/expired, 403 current processing or CSRF missing, neutral 404 inaccessible/nonexistent handle or fixture, 409 stale input/revision/idempotency/action mismatch, 422 invalid bounded request, 429 demo attempt ceiling, 503 source configuration/database/required audit unavailable. Validation classification itself is a successful authorized request with category accepted/review_required/malformed/unsupported/duplicate; HTTP 200 does not mean clinical approval or report acceptance.

All fictional professionals (including assigned case-metadata counsellor), support and partners are denied report content. No separate professional-report purpose is approved/implemented; unresolved authority defaults deny. Invitation/joint assessment/result disclosure never grants raw report access. Future purpose design, real data/laboratory connection, clinical rules and model/RAG integrations require separate authorization and unresolved governance review.
