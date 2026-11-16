export type Fixture = {
  id: string;
  label: string;
  operation: "import" | "amend";
  expected:
    "accepted" | "review_required" | "malformed" | "unsupported" | "duplicate";
};
export type ImportReceipt = {
  outcome_handle: string;
  category: Fixture["expected"];
  reason_codes: string[];
  report_handle: string | null;
  revision_handle: string | null;
  input_version_after: number;
  current_input_version: number;
  replayed: boolean;
  clinical_interpretation: false;
};
export type ReportVersion = {
  revision_handle: string;
  source_revision_id: string;
  version: number;
  state: "active" | "superseded" | "review_required";
  validation_state: "accepted" | "review_required";
  supersedes_revision_handle: string | null;
  amendment_reason: string | null;
  imported_at: string;
  validated_at: string;
  source_sha256: string;
  fixture_id: string;
  imported_by: string;
};
export type ReportMetadata = {
  report_handle: string;
  source_report_id: string;
  active_revision_handle: string | null;
  versions: ReportVersion[];
};
export type ReportDetail = {
  report_handle: string;
  revision: ReportVersion;
  disclaimer: string;
  content: {
    report_id: string;
    revision_id: string;
    schema_version: string;
    laboratory_id: string;
    sample: { id: string };
    panel: string;
    created_at: string;
    issued_at: string;
    status: string;
    coverage: {
      included: string[];
      excluded: string[];
      limitations: string[];
    } | null;
    observations: {
      id: string;
      marker: string;
      value: string | null;
      validity: string;
    }[];
    provenance: {
      source_id: string;
      generated_by: string;
      source_version: number;
    };
  };
};
export type ReportHistory = ImportReceipt & {
  operation: "import" | "amend";
  fixture_id: string;
  created_at: string;
};
