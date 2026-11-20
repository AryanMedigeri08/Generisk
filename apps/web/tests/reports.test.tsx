import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportWorkspace } from "../src/components/report-workspace";
import {
  identityApi,
  type DemoSession,
  type Permission,
  type PrivateCase,
} from "../src/lib/identity";

vi.mock("../src/lib/identity", async (original) => ({
  ...(await original<typeof import("../src/lib/identity")>()),
  identityApi: vi.fn(),
}));
const api = vi.mocked(identityApi);
const session: DemoSession = {
  user_id: "demo-user-a",
  username: "demo-a",
  display_name: "Fictional A",
  role: "individual",
  csrf_token: "fictional-report-csrf",
  expires_at: "2026-12-01T00:00:00Z",
  demo_only: true,
};
const currentCase: PrivateCase = {
  id: "syn-case-01",
  display_name: "Fictional A",
  scenario: "Synthetic",
  input_version: 1,
  is_synthetic: true,
};
const permission: Permission = {
  id: "fictional-choice",
  scope: "processing",
  scope_key: "processing:syn-case-01:v1",
  state: "granted",
  version: 1,
  target_version: 1,
  case_id: "syn-case-01",
  joint_id: null,
  expires_at: null,
};
const metadata = {
  report_handle: "11111111-1111-1111-1111-111111111111",
  source_report_id: "syn-report-a-complete",
  active_revision_handle: "22222222-2222-2222-2222-222222222222",
  versions: [
    {
      revision_handle: "22222222-2222-2222-2222-222222222222",
      version: 1,
      state: "active",
      validation_state: "accepted",
    },
  ],
};
const fixtures = [
  {
    id: "fixture-a-complete",
    label: "A complete",
    operation: "import",
    expected: "accepted",
  },
  {
    id: "fixture-a-unsupported",
    label: "A unsupported",
    operation: "import",
    expected: "unsupported",
  },
];
const detail = {
  report_handle: metadata.report_handle,
  revision: {
    ...metadata.versions[0],
    source_sha256: "a".repeat(64),
    imported_at: "2026-11-01T00:00:00Z",
    validated_at: "2026-11-01T00:00:00Z",
    amendment_reason: null,
  },
  disclaimer: "Fictional synthetic report. Not clinically interpretable.",
  content: {
    schema_version: "amanah-report-1",
    laboratory_id: "syn-lab-imaginary",
    sample: { id: "syn-sample-a" },
    panel: "syn-panel-widgets",
    created_at: "2026-11-01",
    issued_at: "2026-11-01",
    provenance: {
      source_id: "syn-source-fixture-library",
      source_version: 1,
      generated_by: "syn-fictional-author",
    },
    coverage: {
      included: ["syn-marker-orbit"],
      excluded: ["syn-marker-kite"],
      limitations: ["limited-panel"],
    },
    observations: [
      {
        id: "syn-observation-orbit",
        marker: "syn-marker-orbit",
        value: "demo-token-amber",
        validity: "recorded",
      },
    ],
  },
};
const receipt = {
  category: "accepted",
  reason_codes: ["structurally_supported_only"],
  input_version_after: 2,
  current_input_version: 2,
  replayed: false,
};
const refresh = vi.fn(async () => {});
async function perform(work: () => Promise<void>) {
  await work();
}

beforeEach(() => {
  api.mockReset();
  refresh.mockClear();
  api.mockImplementation(async (path) => {
    if (path === "reports/fixtures") return fixtures;
    if (path === "reports") return [metadata];
    if (path === "reports/view") return detail;
    if (path === "reports/import" || path === "reports/amend") return receipt;
    return [];
  });
});

function workspace(permissions: Permission[] = [permission]) {
  return (
    <ReportWorkspace
      session={session}
      currentCase={currentCase}
      permissions={permissions}
      refresh={refresh}
      perform={perform}
    />
  );
}

describe("fictional report management", () => {
  it("requires current processing, and offers no arbitrary file or content input", async () => {
    const { container } = render(workspace([]));
    await screen.findByRole("option", { name: "A complete" });
    expect(
      screen.getByRole("button", { name: "Import selected fixture" }),
    ).toBeDisabled();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(api).not.toHaveBeenCalledWith("reports");
    expect(screen.queryByText("syn-report-a-complete")).not.toBeInTheDocument();
  });

  it("imports only a fixture reference with CSRF, expected version and idempotency", async () => {
    render(workspace());
    await screen.findByRole("option", { name: "A complete" });
    fireEvent.click(
      screen.getByRole("button", { name: "Import selected fixture" }),
    );
    await screen.findByRole("heading", {
      name: "Validation outcome: accepted",
    });
    expect(api).toHaveBeenCalledWith("reports/import", session.csrf_token, {
      fixture_id: "fixture-a-complete",
      expected_input_version: 1,
      idempotency_key: expect.any(String),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/allow processing for the new version/),
    ).toBeInTheDocument();
  });

  it("shows explicit exclusions and clears old report data when processing is withdrawn", async () => {
    const { rerender } = render(workspace());
    fireEvent.click(
      await screen.findByRole("button", { name: "View revision 1" }),
    );
    await screen.findByText("demo-token-amber");
    expect(
      screen.getByText(/Excluded fictional markers: syn-marker-kite/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/FHIR-inspired; not conformance tested/),
    ).toBeInTheDocument();
    rerender(workspace([{ ...permission, state: "withdrawn" }]));
    await waitFor(() =>
      expect(screen.queryByText("demo-token-amber")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: "View revision 1" }),
    ).not.toBeInTheDocument();
  });

  it("applies the predefined amendment to the selected owned report and version", async () => {
    render(workspace());
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Apply predefined correction",
      }),
    );
    await screen.findByRole("heading", {
      name: "Validation outcome: accepted",
    });
    expect(api).toHaveBeenCalledWith("reports/amend", session.csrf_token, {
      fixture_id: "fixture-a-amend",
      report_handle: metadata.report_handle,
      expected_revision: 1,
      expected_input_version: 1,
      idempotency_key: expect.any(String),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("displays unsupported validation safely without inventing report fields", async () => {
    api.mockImplementation(async (path) => {
      if (path === "reports/fixtures") return fixtures;
      if (path === "reports/import")
        return {
          ...receipt,
          category: "unsupported",
          reason_codes: ["schema_unsupported"],
          current_input_version: 1,
          input_version_after: 1,
        };
      return [];
    });
    render(workspace());
    await screen.findByRole("option", { name: "A unsupported" });
    fireEvent.change(screen.getByLabelText("Allowlisted synthetic fixture"), {
      target: { value: "fixture-a-unsupported" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Import selected fixture" }),
    );
    await screen.findByRole("heading", {
      name: "Validation outcome: unsupported",
    });
    expect(screen.queryByText("demo-token-amber")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Structural validation is not clinical validation/),
    ).toBeInTheDocument();
  });
});
