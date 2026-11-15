import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import fixtures from "../../../data/synthetic/demo-cases.json";
import { DemoDashboard } from "../src/components/demo-dashboard";
import {
  getDemoSnapshot,
  parseDemoCases,
  unavailableSnapshot,
} from "../src/lib/demo";

const snapshot = {
  api: "online" as const,
  database: "ready" as const,
  cases: parseDemoCases({ demo_only: true, cases: fixtures }),
  knowledge: "unavailable" as const,
};

describe("fictional fixture boundary", () => {
  it("accepts only explicitly synthetic foundation records", () => {
    expect(snapshot.cases).toHaveLength(2);
    expect(snapshot.cases.every((item) => item.is_synthetic)).toBe(true);
  });

  it("rejects responses without the demonstration marker", () => {
    expect(() => parseDemoCases({ cases: fixtures })).toThrow(/synthetic/);
  });

  it("rejects a non-synthetic record or clinical status", () => {
    expect(() =>
      parseDemoCases({
        demo_only: true,
        cases: [{ ...fixtures[0], is_synthetic: false }],
      }),
    ).toThrow();
    expect(() =>
      parseDemoCases({
        demo_only: true,
        cases: [{ ...fixtures[0], demo_status: "diagnosed" }],
      }),
    ).toThrow();
  });
});

describe("accessible foundation states", () => {
  it("labels fictional fixtures, locked protected flows and unavailable knowledge", () => {
    render(<DemoDashboard initialSnapshot={snapshot} />);
    expect(screen.getByText(/NOT FOR CLINICAL USE/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Fictional participant A" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Protected flows locked")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Approved knowledge is not yet available/,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("does not invent results when the database is unavailable", () => {
    render(<DemoDashboard initialSnapshot={unavailableSnapshot} />);
    expect(
      screen.getByText(/Fictional fixtures are unavailable/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Fictional participant A" }),
    ).not.toBeInTheDocument();
  });

  it("announces refresh completion", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => snapshot }),
    );
    render(<DemoDashboard initialSnapshot={snapshot} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Refresh demo status/ }),
    );
    expect(
      await screen.findByText("Demonstration status refreshed."),
    ).toBeInTheDocument();
  });

  it("clears stale fixtures and announces service failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("fictional backend error")),
    );
    render(<DemoDashboard initialSnapshot={snapshot} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Refresh demo status/ }),
    );
    expect(
      await screen.findByText(/The demonstration service is unavailable/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Fictional participant A" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("fictional backend error"),
    ).not.toBeInTheDocument();
  });
});

describe("server API boundary", () => {
  it("returns safe unavailability on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connection details")),
    );
    expect(await getDemoSnapshot()).toEqual(unavailableSnapshot);
  });

  it("does not display fixtures when readiness fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ demo_only: true, cases: fixtures }),
        }),
    );
    expect(await getDemoSnapshot()).toMatchObject({
      api: "online",
      database: "unavailable",
      cases: [],
    });
  });

  it("loads the API-backed synthetic database fixtures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ demo_only: true, cases: fixtures }),
        }),
    );
    expect(await getDemoSnapshot()).toEqual(snapshot);
  });
});
