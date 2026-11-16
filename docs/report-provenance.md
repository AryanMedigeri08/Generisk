# Synthetic report source and revision provenance

2026-11-16, Asia/Calcutta. DEC-011 P04 hackathon only. Fictional records, no medical validity, real lab integration or clinical certification. [ADR-007](adr/ADR-007-synthetic-report-storage.md) records storage/consistency decisions.

## Source integrity and preserved originals

The packaged manifest allowlists fixture ID, constrained relative filename, owner/case, action and expected full-pipeline scenario. A SHA-256 of the actual bounded file bytes must match before parsing. The expected-result label is documentation/test input, never a validator bypass. Client requests cannot specify a file path, source URL, arbitrary document, hash, observations or owner. Reads reject escape/symlink paths, excessive bytes and invalid manifest data. No source URL is fetched.

`.gitattributes` fixes the report library to LF on both Windows and Linux, so Git newline conversion cannot silently invalidate its exact-byte manifest. Hash checking does not normalize or repair unexpected source changes.

For accepted/review-required revisions, immutable TEXT preserves the exact original UTF-8 JSON including formatting, immutable JSONB preserves validated structured fields, and SHA-256 binds to original bytes. Importer identity, fixture ID, source identifiers/times, import/validation timestamps, version and predecessor/reason are retained. Source time is never silently replaced with import time. A correction creates another immutable row; it cannot overwrite an original. Original TEXT is internal only, with no raw export/download endpoint.

Hashes establish equality with the repository fixture manifest, not laboratory authenticity, a digital signature, clinical review or independent trust. A repository/DB owner can replace files, hashes, code or triggers. No production tamper-proof/evidence-retention claim is made.

## Version and state model

`p04_reports`: owner/case/logical source family and active revision pointer. Composite foreign key binds to the actual P03 owner/case pair. A family cannot exist independently of its authorized relationship. Active pointer must reference the same family and its latest structurally accepted revision; SQL trigger rejects reactivation of an older revision. Unique family/version/source-revision constraints prevent duplicate revisions. There is one active pointer per family, not a universal medical current-report claim across panels.

`p04_revisions`: immutable original/validated content, validation state and source/import/provenance metadata. Composite predecessor key stays within the family; the service additionally requires exact prior source ID and consecutive version. Superseded state is derived from the active pointer/successor relationship, preserving original validation metadata. A review-required amendment removes active status instead of silently continuing to treat an obsolete accepted source as current.

`p04_import_outcomes`: append-only authorized import/amend attempts, minimized reason codes, actor/case, source hash, optional record/revision links, operation/fingerprint/idempotency and resulting input version. Invalid/unsupported inputs store no arbitrary source content. API history returns the latest 30 own outcomes, not keys, fingerprints or other users' events. P03 audit records operation/authorization/validation category and case-input version, without report findings or resource handles in general telemetry.

Database triggers reject revision/outcome UPDATE/DELETE/TRUNCATE and report identity changes/deletion/truncation. Active-head updates are constrained. Database-owner privileges remain a known local-demo limitation. Downgrade is only exercised on disposable `_test` databases; normal startup applies additive upgrades/seeds and preserves prior P02/P03 records.

## Permission invalidation and concurrency

Every report read/write joins P03's server identity and advisory-lock transaction. Report data is owner-only with current own processing permission. Existing counsellor assignment/processing allows synthetic case metadata only: report content needs a distinct professional purpose that is unresolved and therefore denied. Support, partners, invitations and joint consent cannot grant raw access.

Both first persisted ingestion and correction change the authoritative input. They invoke P03 `supersede_case` in the same transaction: input version increments, affected joint/output versions increment, reviewed placeholder flag clears and dependent old choices become superseded. There is no auto-grant for new processing/assessment/disclosure scopes. The owner must affirm current processing before viewing/processing again. All affected parties must make fresh joint choices where appropriate. Invalid or duplicate sources do not advance input/version state.

If withdrawal is ordered first, a later correction fails processing authorization. If correction is ordered first, the old permission is already superseded; a concurrent old-version withdrawal conflicts safely rather than reviving a grant. All later dependent access is denied. Required audit persistence failure rolls back report rows/head, input/joint versions, permission transitions and outcome together. Previously viewed information cannot be erased by this guarantee.

Retention/purge, lawful purpose, hosting, professional access and evidence duties remain unresolved APR-01–APR-08/H01–H12; none is closed by a synthetic engineering PASS. No report-derived embeddings, model prompts, RAG indexes or clinical interpretation.
