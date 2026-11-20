import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../src/app/api/p03/[...path]/route";
import { RiskCard } from "../src/components/risk-card";
import { identityApi } from "../src/lib/identity";

vi.mock("../src/lib/identity", async (original) => ({
  ...(await original<typeof import("../src/lib/identity")>()),
  identityApi: vi.fn(),
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("allows stateless what-if only and strips every private transport header", async () => {
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json({ state: "COMPUTED" }),
  );
  vi.stubGlobal("fetch", fetcher);
  const headers = {
    Origin: "http://localhost:13000",
    "X-Demo-Request": "1",
    "Content-Type": "application/json",
    Cookie: "amanah_demo_session=fictional-cookie",
    "X-CSRF-Token": "fictional-csrf",
    "X-Risk-Binding": "a".repeat(64),
    "X-Risk-Joint": "00000000-0000-4000-8000-000000000001",
  };
  const context = { params: Promise.resolve({ path: ["risk", "whatif"] }) };
  expect(
    (
      await POST(
        new NextRequest("http://localhost:13000/api/p03/risk/whatif", {
          method: "POST",
          headers,
          body: JSON.stringify({ mode: "mendelian" }),
        }),
        context,
      )
    ).status,
  ).toBe(200);
  const forwarded = fetcher.mock.calls[0][1]?.headers;
  expect(forwarded).not.toHaveProperty("cookie");
  expect(forwarded).not.toHaveProperty("x-csrf-token");
  expect(forwarded).not.toHaveProperty("X-Risk-Binding");
  expect(forwarded).not.toHaveProperty("X-Risk-Joint");
  fetcher.mockClear();
  expect(
    (
      await GET(
        new NextRequest("http://localhost:13000/api/p03/risk/whatif", {
          headers,
        }),
        context,
      )
    ).status,
  ).toBe(405);
  expect(
    (
      await POST(
        new NextRequest("http://localhost:13000/api/p03/risk/my-assessment", {
          method: "POST",
          headers,
        }),
        { params: Promise.resolve({ path: ["risk", "my-assessment"] }) },
      )
    ).status,
  ).toBe(405);
  expect(fetcher).not.toHaveBeenCalled();
});

it("forwards a bounded snapshot pin only to an explicit private risk GET", async () => {
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json({ state: "UNAVAILABLE" }),
  );
  vi.stubGlobal("fetch", fetcher);
  await GET(
    new NextRequest("http://localhost:13000/api/p03/risk/couple-assessment", {
      headers: {
        "X-Demo-Request": "1",
        Cookie: "amanah_demo_session=fictional-cookie",
        "X-Risk-Binding": "a".repeat(64),
        "X-Risk-Joint": "00000000-0000-4000-8000-000000000001",
      },
    }),
    { params: Promise.resolve({ path: ["risk", "couple-assessment"] }) },
  );
  expect(fetcher.mock.calls[0][1]?.headers).toHaveProperty(
    "X-Risk-Binding",
    "a".repeat(64),
  );
  expect(fetcher.mock.calls[0][1]?.headers).toHaveProperty("cookie");
  expect(fetcher.mock.calls[0][1]?.headers).toHaveProperty(
    "X-Risk-Joint",
    "00000000-0000-4000-8000-000000000001",
  );
});

it("requests an explicit purpose grant, displays codes/fractions and rejects a stale pin without recomputing", async () => {
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json({
      state: "SHARED_CARRIER",
      label:
        "Synthetic demonstration. Educational estimate. Not a diagnosis. Not for clinical use.",
      message_keys: ["risk.shared_gene_conditional"],
      bindings: { scope_hash: "a".repeat(64) },
      genes: [
        {
          gene_symbol: "CFTR",
          state: "SHARED_CARRIER",
          caveat_codes: ["GENE_LEVEL_ONLY"],
          numbers: {
            affected: {
              exact: { num: 1, den: 4 },
              natural_frequency: { k: 1, n: 4 },
              basis: "derived",
            },
          },
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetcher);
  const refresh = vi.fn(async () => {});
  const props = {
    session: {
      user_id: "demo-user-a",
      username: "demo-a",
      display_name: "Fictional A",
      role: "individual" as const,
      csrf_token: "fictional-csrf",
      expires_at: "2026-12-01",
      demo_only: true as const,
    },
    currentCase: {
      id: "syn-case-01",
      display_name: "Fictional A",
      scenario: "Synthetic",
      input_version: 2,
      is_synthetic: true as const,
    },
    permissions: [],
    joints: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        version: 1,
        output_version: 1,
        status: "available_for_demo_review" as const,
        can_disclose: true,
        placeholder_reviewed: false,
      },
    ],
    refresh,
    perform: async (work: () => Promise<void>) => work(),
  };
  render(<RiskCard {...props} />);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Allow my report summary" }),
  );
  await waitFor(() =>
    expect(identityApi).toHaveBeenCalledWith(
      "me/consents",
      "fictional-csrf",
      expect.objectContaining({
        purpose: "educational_risk",
        case_id: "syn-case-01",
        target_version: 2,
      }),
    ),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Show the shared result" }),
  );
  expect(await screen.findByText(/affected 1\/4/)).toBeInTheDocument();
  fetcher.mockResolvedValueOnce(
    Response.json(
      { error: { code: "STALE_BINDING", message: "risk.stale_binding" } },
      { status: 409 },
    ),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Show the shared result" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent("STALE_BINDING");
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[1][1]?.headers).toHaveProperty(
    "X-Risk-Binding",
    "a".repeat(64),
  );
  expect(screen.queryByText(/affected 1\/4/)).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Start a fresh calculation" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Show the shared result" }),
  );
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
  expect(fetcher.mock.calls[2][1]?.headers).not.toHaveProperty(
    "X-Risk-Binding",
  );
});
