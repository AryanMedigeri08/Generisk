# Wholly fictional report fixture manifest

DEC-011 P04 only. **Synthetic Genetic Report — Demonstration Only — Not Medical Advice.** No real/de-identified records, real laboratories/samples, genomic sequences, variants, pathogenicity or medical probabilities. Marker/token fields have no clinical meaning.

`manifest.json` is the runtime allowlist and SHA-256 source ledger. `valid/` contains structurally supported/review examples; `invalid/` contains intentional parser/association/provenance failures and a context-invalid amendment. Client chooses IDs only, never filenames, paths or arbitrary JSON. A/B entries bind to their existing independent fictional accounts/cases. Unknown fixtures deny.

| Fixture ID | Expected full-pipeline outcome | Purpose |
|---|---|---|
| fixture-a-complete | accepted | Initial A source; explicit coverage/exclusions |
| fixture-a-duplicate | duplicate after complete exists; accepted if first | Identical original bytes; never duplicate active revision |
| fixture-b-limited | accepted | B-only limited panel; exclusions preserved, no negative-risk inference |
| fixture-a-incomplete | review_required | Explicit missing coverage/uncertain value, non-interpretable; no active supported head |
| fixture-a-unsupported | unsupported | Unrecognized schema version |
| fixture-a-wrong-association | malformed | Sample/case mismatch |
| fixture-a-amend | accepted through amend action after A complete | Version two, exact predecessor, synthetic correction reason/token change |
| fixture-a-conflict | malformed | Duplicate/conflicting observation identifier |
| fixture-a-missing-required | malformed | Required laboratory field absent |
| fixture-a-bad-provenance | malformed | Unrecognized author/source assertion |
| fixture-a-unsupported-field | unsupported | Extra unimplemented extension; no automatic interpretation |
| fixture-a-invalid-value | malformed | Incorrect observation value type |
| fixture-a-invalid-amend | malformed in amendment pipeline | Structurally typed version three with absent predecessor; existing valid source unchanged |

Expected labels are not trusted validation results. The parser can structurally accept a duplicate or context-invalid amendment; transaction-stage source/version checks determine its full outcome. Invalid/unsupported imports append minimized outcomes, not source records. Do not edit a committed source to correct it: add a separately identified revision and manifest entry with predecessor metadata, review scope, schema tests and new hash. No fixture enters KnowledgeProvider, pgvector or an LLM. See [schema](../../../docs/report-schema.md), [validation](../../../docs/report-validation.md) and [provenance](../../../docs/report-provenance.md).
