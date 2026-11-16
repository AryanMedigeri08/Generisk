# ADR-007 — Fixture-only report storage and correction consistency

2026-11-16, Asia/Calcutta. ACCEPTED for DEC-011 P04 synthetic engineering only; not clinical/standards approval. P00/full clinical P01 BLOCKED, APR-01–APR-08 PENDING, H01–H12 OPEN.

## Decision

Use only a packaged finite fictional JSON library with SHA-256 manifest and strict Pydantic schema. No arbitrary upload or external source. The shape borrows report/observation/sample/provenance concepts from FHIR R4, without resources/profiles/conformance claims. Fictional marker/value enums have no clinical meaning. Classification is deterministic structural support/review/malformed/unsupported, not medical interpretation.

Store normalized family/head/ownership and immutable revision rows in PostgreSQL, with both bounded exact source JSON TEXT and validated JSONB. TEXT preserves original byte hashing, while JSONB supports structured authorized summaries without reparsing arbitrary files or losing source history. Normalized observations would introduce more joins/tables for at most three fictional observations and no clinical queries; postpone until separately justified. No object store, worker, new database, embeddings or vector index is needed.

Composite owner/case and same-family head/predecessor foreign keys, unique family/version IDs, append-only triggers and a latest-accepted-head guard constrain integrity. Source metadata cannot be overwritten. Invalid outcomes append minimized codes without source rows. Supersession is a derived lifecycle projection over immutable revisions/head, rather than rewriting original source validation. The raw source TEXT is not exposed through an export API. Database-owner privilege can alter triggers; this remains a local engineering demonstration, not production audit immutability.

## Reuse and authorization

Reuse P03 run()/opaque sessions/CSRF/current permission provider/advisory gate and supersede_case. No parallel identity or consent authority. Own current processing is mandatory for report metadata/content/history/import/correction; only the fictional template catalog may be previewed without processing. Support/partners/fictional professionals cannot read reports. P03 counsellor metadata assignment is insufficient: report-specific professional purpose is unresolved and defaults deny instead of silently extending processing consent.

Both first persisted report input and amendment advance the P03 input version, supersede affected current processing/joint/output scopes and clear reviewed-placeholder flags in the same transaction. User must grant fresh processing for the changed version; both participants must independently authorize any future changed joint scope. This is more explicit than carrying forward a broad grant and avoids stale-input authorization. It adds a deliberate UI step, explained before import/correction. A reviewed placeholder exists only as an explicit non-clinical test fixture, not runtime generation.

Reads, corrections, withdrawal, outcome and audit writes share P03's serialization point. Audit INSERT failure rolls everything back. Withdrawal-first denies later correction; correction-first makes old permission stale/superseded, so old withdrawal conflicts without enabling access. Repeat keys/payloads return prior outcomes under current permission; occupied source revisions cannot be overwritten/reactivated. No deletion of previously viewed information is promised.

## Verification and limits

Actual PostgreSQL constraints/triggers, migration downgrade/re-upgrade preserving P03, both lock-waiter orders, denied raw report relationships, typed/byte/depth/path/hash failures, browser correction and local/CI runs must pass; [evidence](../evidence/p04-validation.md) records observations. Tests do not approve retention, hosting, privacy/clinical purpose, lab trust, FHIR conformance, Arabic copy or production security. Local public credentials, HTTP loopback, database-owner connection, global lock, finite fixture/sample mapping, no cleanup and no real professional purpose remain known limits. P05+ is not authorized here.
