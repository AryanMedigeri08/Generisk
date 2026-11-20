import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { content } from "../src/content/loader";
import { ContentProvider } from "../src/content/locale";
import { ResultExplainer } from "../src/components/learn/result-explainer";
import { ResultPreview } from "../src/components/learn/lesson-studio";
import { OnePregnancy } from "../src/components/learn/chance-widgets";
import { preview } from "../src/lib/learn/previews";
import { whatIf } from "../src/lib/learn/risk";

it("explains own, shared and unavailable states in plain words, with no invented partner fields", () => {
  const { rerender } = render(<ResultExplainer output={preview("own")} />);
  expect(
    screen.getByText(content.risk.messages["risk.own_status_summary"]),
  ).toBeInTheDocument();
  expect(screen.getByText(content.risk.states.OWN_CARRIER)).toBeInTheDocument();
  rerender(<ResultExplainer output={preview("couple")} />);
  expect(
    screen.getByText(content.risk.caveats.GENE_LEVEL_ONLY),
  ).toBeInTheDocument();
  expect(screen.getAllByText("4")).toHaveLength(2);
  rerender(<ResultExplainer output={preview("unavailable")} />);
  expect(
    screen.getByText(content.risk.messages["risk.unavailable"]),
  ).toBeInTheDocument();
  expect(screen.queryByText("CFTR")).not.toBeInTheDocument();
  expect(screen.queryByText("4")).not.toBeInTheDocument();
});
it("fails closed on unknown keys/contracts instead of displaying misleading numbers", () => {
  const { rerender } = render(
    <ResultExplainer
      output={{ ...preview("couple"), message_keys: ["risk.future_key"] }}
    />,
  );
  expect(
    screen.getByText(content.ui.explanation_unavailable),
  ).toBeInTheDocument();
  expect(screen.queryByText("4")).not.toBeInTheDocument();
  rerender(
    <ResultExplainer
      output={{ ...preview("couple"), contract_version: "future" }}
    />,
  );
  expect(
    screen.getByText(content.ui.explanation_unavailable),
  ).toBeInTheDocument();
});
it("can change a UI bundle without editing a lesson component", () => {
  const bundle = {
    ...content,
    ui: { ...content.ui, draw: "Draw in another English bundle" },
  };
  render(
    <ContentProvider bundle={bundle}>
      <OnePregnancy />
    </ContentProvider>,
  );
  expect(
    screen.getByRole("button", { name: "Draw in another English bundle" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: content.ui.draw }),
  ).not.toBeInTheDocument();
});
it("uses only fictional preview state and never requests private assessment data", () => {
  const fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetcher);
  render(<ResultPreview />);
  fireEvent.change(screen.getByLabelText(content.ui.preview_kind), {
    target: { value: "unavailable" },
  });
  expect(
    screen.getByText(content.risk.messages["risk.unavailable"]),
  ).toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});
it("sends hypothetical inputs without credentials and rejects an invalid server contract", async () => {
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json(preview("couple")),
  );
  vi.stubGlobal("fetch", fetcher);
  await whatIf({
    mode: "mendelian",
    gene_symbol: "CFTR",
    a_status: "carrier",
    b_status: "carrier",
  });
  expect(fetcher.mock.calls[0][0]).toBe("/api/p03/risk/whatif");
  expect(fetcher.mock.calls[0][1]).toMatchObject({
    credentials: "omit",
    cache: "no-store",
    method: "POST",
  });
  expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty("cookie");
  fetcher.mockResolvedValueOnce(
    Response.json({
      contract_version: "unknown",
      state: "COMPUTED",
      message_keys: [],
    }),
  );
  await expect(whatIf({ mode: "residual" })).rejects.toThrow(
    "WHATIF_UNAVAILABLE",
  );
});

it("never shows numbers attached to an unresolved envelope", () => {
  const example = preview("couple");
  render(
    <ResultExplainer
      output={{
        ...example,
        state: "UNKNOWN",
        message_keys: ["risk.unknown"],
        numbers: example.genes![0].numbers,
        genes: undefined,
      }}
    />,
  );
  expect(
    screen.getByText(content.risk.messages["risk.unknown"]),
  ).toBeInTheDocument();
  expect(screen.queryByText("4")).not.toBeInTheDocument();
});
