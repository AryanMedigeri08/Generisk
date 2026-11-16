import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { PanelCatalog } from "../src/components/panel-catalog";
import { GET, POST } from "../src/app/api/p03/[...path]/route";
import type { PanelData } from "../src/lib/panel";

const missing = {
  value: null,
  basis: "illustrative" as const,
  source_id: null,
  note: "No matching population or assay value was selected.",
};
const data: PanelData = {
  panel_version: "a".repeat(64),
  panel: {
    panel_id: "gen-panel-demo-v1",
    version: "1.0.0",
    label:
      "Generisk demo panel, illustrative subset, NOT the Abu Dhabi clinical panel.",
    disclaimer: "Synthetic demonstration, not for clinical use.",
    genes: [
      {
        gene_symbol: "CFTR",
        hgnc_id: "HGNC:1884",
        symbol_source_id: "hgnc-cftr",
        conditions: [
          {
            name_en: "Cystic fibrosis",
            name_ar: null,
            inheritance: "autosomal_recessive",
            severity_band: "variable",
            summary:
              "A public reference summary, not an interpretation of any person.",
            source_id: "nlm-cf",
          },
        ],
        engine_support: "supported",
        support_note:
          "Fictional fixture scope only; no clinical engine is active.",
        reference_values: {
          carrier_frequency: missing,
          allele_frequency_q: missing,
          detection_rate: missing,
        },
      },
    ],
    sources: [
      {
        id: "hgnc-cftr",
        title: "HGNC CFTR",
        url: "https://rest.genenames.org/fetch/symbol/CFTR",
        retrieved_on: "2026-11-16",
        field: "symbol and hgnc_id",
        license_url: "https://www.genenames.org/about/license/",
        license_note: "HGNC CC0, attribution retained.",
      },
      {
        id: "nlm-cf",
        title: "MedlinePlus Genetics CF",
        url: "https://medlineplus.gov/genetics/condition/cystic-fibrosis/",
        retrieved_on: "2026-11-16",
        field: "Description, Causes and Inheritance",
        license_url: "https://medlineplus.gov/about/using/usingcontent/",
        license_note: "NLM Genetics summary; original wording and attribution.",
      },
    ],
  },
};

describe("public reference catalogue", () => {
  it("shows attribution and unavailable basis without inventing a rate", () => {
    render(<PanelCatalog data={data} />);
    expect(screen.getByRole("heading", { name: "CFTR" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cystic fibrosis" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Unavailable — no number/)).toHaveLength(3);
    expect(screen.getByRole("link", { name: "HGNC CFTR" })).toHaveAttribute(
      "href",
      data.panel.sources[0].url,
    );
    expect(screen.getByText(data.panel.label)).toBeInTheDocument();
  });
  it("fails safely when public references cannot be loaded", () => {
    render(<PanelCatalog data={null} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "No reference values have been invented",
    );
    expect(
      screen.queryByRole("heading", { name: "CFTR" }),
    ).not.toBeInTheDocument();
  });
  it("allows only GET through the explicit panel proxy root and strips private cookies", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify(data), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetcher);
    try {
      const response = await GET(
        new NextRequest("http://localhost:13000/api/p03/panel", {
          headers: {
            "X-Demo-Request": "1",
            Cookie: "amanah_demo_session=fictional-public-test-only",
            "X-CSRF-Token": "fictional-test",
          },
        }),
        { params: Promise.resolve({ path: ["panel"] }) },
      );
      expect(response.status).toBe(200);
      expect(fetcher).toHaveBeenCalledTimes(1);
      const options = fetcher.mock.calls[0]?.[1];
      expect(options).toBeDefined();
      expect(options?.headers).not.toHaveProperty("cookie");
      expect(options?.headers).not.toHaveProperty("x-csrf-token");
      fetcher.mockClear();
      const denied = await POST(
        new NextRequest("http://localhost:13000/api/p03/panel", {
          method: "POST",
        }),
        { params: Promise.resolve({ path: ["panel"] }) },
      );
      expect(denied.status).toBe(405);
      expect(fetcher).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
