# Synthetic report contract — amanah-report-1

2026-11-16, Asia/Calcutta. **Synthetic Genetic Report — Demonstration Only — Not Medical Advice.** Implemented only under DEC-011; not clinically interpretable or standards certified. The API accepts fixture identifiers, never this document as arbitrary user input.

## FHIR inspiration and limits

The grouping of report identity/status, subject, specimen, issue time and observations is inspired by [FHIR R4 DiagnosticReport](https://hl7.org/fhir/R4/diagnosticreport.html). Fictional atomic name/value fields reflect the grouping concept in [R4 Observation](https://hl7.org/fhir/R4/observation.html); sample ownership/context draws on [R4 Specimen](https://hl7.org/fhir/R4/specimen.html), and source/activity/version metadata on [R4 Provenance](https://hl7.org/fhir/R4/provenance.html). Primary pages inspected 2026-11-16. These are conceptual mappings, not implemented FHIR resources or a Clinical Genomics implementation-guide profile.

No FHIR resourceType/Bundle/reference resolution, terminology bindings, HGVS/real variant representation, genomic sequences, medical interpretation, FHIR server/search, signatures, CapabilityStatement, interoperability or conformance test suite is implemented. Keys/enums below are project-specific. No formal FHIR/genomics conformance claim. Reports stay within owner-authorized PostgreSQL; they never enter educational retrieval.

## Typed required fields

`services/api/src/app/p04/schemas.py` is the implemented Pydantic contract. Extra fields are forbidden; identifiers, lists, enum values and numbers are bounded and type checked. Missing required fields are malformed. Explicit null coverage/unknown observation values are retained as unknowns in a non-interpretable review state.

| Field | Contract / meaning |
|---|---|
| schema_version | Exactly `amanah-report-1`; other declared versions unsupported |
| synthetic / disclaimer | Boolean true (numeric/string coercion rejected) / exact fictional, not-clinically-interpretable statement |
| report_id / revision_id | Distinct logical family and source revision identifiers, bounded `syn-` namespace; no real identifiers |
| revision | Integer 1–20; initial one, amendment exactly predecessor + one |
| owner_id / case_id | Only the two existing fictional participants/cases; must match authorized owner AND packaged manifest |
| laboratory_id | Exactly `syn-lab-imaginary`; no real laboratory claim |
| sample | Controlled synthetic sample ID, owner and case; all must match report/manifest linkage |
| created_at / issued_at | Required timezone-aware timestamps; creation cannot follow issue; source times are fictional, not import time |
| panel | Exactly `syn-panel-widgets` |
| coverage | Explicit included/excluded fictional-marker enums, maximum three each; no overlap/duplicates; known limitations, or explicit null requiring review |
| observations | One to three unique IDs and markers; only `syn-marker-orbit`, `syn-marker-lantern`, `syn-marker-kite`; no real genes/variants |
| observation value_type / value / validity | `synthetic-token`; `demo-token-amber`, `demo-token-blue` or null; `recorded`, `missing`, `uncertain` with consistent value presence |
| status | `final`, `preliminary`, `amended`; preliminary/uncertain/incomplete scope requires review |
| supersedes_revision_id / amendment_reason | Null for initial source; exact prior revision and controlled synthetic correction reason for amendment |
| provenance | Fixed fixture-library source/fictional author plus source version equal to revision; not an accredited lab signature |

Observed markers must be declared included when coverage exists. A declared included marker without its observation requires review; excluded or missing fields imply no medical conclusion. `final` means source-document status, never clinical approval.

## Server-generated records

The server adds opaque family/revision handles, importer identity, import/validation UTC timestamps, raw source SHA-256, fixture ID, immutable original JSON and validated JSONB, validation classification, active-head pointer and P03 input-version transitions. User input cannot supply these as authority. Idempotency keys bind to the operation/payload fingerprint; expected case/input and revision checks prevent stale updates.

`accepted` means structurally supported fictional fields only. `review_required` preserves unknowns and has no active supported revision. `unsupported` and `malformed` create minimized validation outcomes, no source revision. `duplicate` reuses an existing identical source without changing input/version state. See [validation](report-validation.md), [provenance](report-provenance.md) and [fixture manifest](../data/synthetic/reports/README.md).

## Clinical governance

This schema settles no clinical scope, lawful purpose, retention, hosting, classification or professional-sharing decision. P00/full clinical P01 BLOCKED; APR-01–APR-08 PENDING, H01–H12 OPEN, especially H05/H06/H09. No P05 rules, diagnosis, probability, medical AI or RAG ingestion.
