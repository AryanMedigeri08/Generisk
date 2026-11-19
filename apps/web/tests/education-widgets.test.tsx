import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { content } from "../src/content/loader";
import { GeneKeys, CopiesReveal } from "../src/components/learn/gene-keys";
import { OnePregnancy } from "../src/components/learn/chance-widgets";
import {
  FamilyTree,
  NegativeBar,
} from "../src/components/learn/server-widgets";
import {
  whatIf,
  type ModelNumber,
  type RiskEnvelope,
} from "../src/lib/learn/risk";
import { sample } from "../src/lib/learn/simulation";
vi.mock("../src/lib/learn/risk", async (original) => ({
  ...(await original<typeof import("../src/lib/learn/risk")>()),
  whatIf: vi.fn(),
}));
const model = vi.mocked(whatIf),
  ui = content.ui;
const number = (num: number, den: number): ModelNumber => ({
  exact: { num, den },
  natural_frequency: { k: num, n: den },
  basis: "derived",
});
const result = (numbers: Record<string, ModelNumber>): RiskEnvelope => ({
  contract_version: "gen-risk-1",
  state: "COMPUTED",
  label: ui.banner,
  message_keys: ["risk.population_model"],
  numbers,
});
beforeEach(() => model.mockReset());

it("reveals gene copies by keyboard without requesting a server", async () => {
  render(<CopiesReveal />);
  const user = userEvent.setup();
  await user.tab();
  await user.keyboard("{Enter}");
  expect(screen.getAllByText(ui.copy_reveal)).toHaveLength(1);
  expect(model).not.toHaveBeenCalled();
});
it("selects both changed copies by keyboard, and presets reset the child without changing the four-cell model", async () => {
  render(<GeneKeys />);
  const user = userEvent.setup();
  const a = screen.getByRole("button", { name: "Pass Copy 2 from Parent A" }),
    b = screen.getByRole("button", { name: "Pass Copy 2 from Parent B" });
  a.focus();
  await user.keyboard("{Enter}");
  b.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("status")).toHaveTextContent(ui.two_changed);
  expect(screen.getAllByRole("row")).toHaveLength(5);
  fireEvent.change(screen.getByLabelText(ui.preset), {
    target: { value: "one_carrier" },
  });
  expect(screen.getByRole("status")).toHaveTextContent(ui.select_copy);
  fireEvent.click(
    screen.getByRole("button", { name: "Pass Copy 2 from Parent A" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Pass Copy 1 from Parent B" }),
  );
  expect(screen.getByRole("status")).toHaveTextContent(ui.one_changed);
});
it("keeps the seeded draw stream moving beyond the bounded history", () => {
  render(<OnePregnancy />);
  for (let i = 0; i < 25; i++)
    fireEvent.click(screen.getByRole("button", { name: ui.draw }));
  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(20);
  expect(items.at(-1)).toHaveTextContent(
    `Draw 25: ${ui[sample(20261119, 25)[24]]}`,
  );
  fireEvent.click(screen.getByRole("button", { name: ui.reset_history }));
  expect(screen.getByText(ui.empty_history)).toBeInTheDocument();
});
it("renders family-tree gold natural frequencies and F exactly, clears them on change, and gives no not-sure number", async () => {
  model.mockResolvedValue(
    result({
      related: number(13, 8000),
      unrelated: number(1, 2500),
      F: number(1, 16),
      ratio: number(65, 16),
    }),
  );
  render(<FamilyTree />);
  expect(model).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: ui.calculate }));
  await waitFor(() => expect(screen.getByText("8000")).toBeInTheDocument());
  expect(screen.getByText("2500")).toBeInTheDocument();
  expect(screen.getByText("1/16")).toBeInTheDocument();
  expect(model).toHaveBeenCalledWith(
    expect.objectContaining({
      mode: "consanguinity",
      relationship: "first_cousins",
      population: "user_scenario",
      q: { num: 1, den: 50 },
    }),
    expect.any(AbortSignal),
  );
  fireEvent.change(screen.getByLabelText(ui.relationship), {
    target: { value: "not_sure" },
  });
  expect(screen.queryByText("8000")).not.toBeInTheDocument();
  expect(
    screen.getByText(content.risk.messages["risk.counsellor_context"]),
  ).toBeInTheDocument();
});
it("draws the intervening generations for cousin paths without treating cousins as siblings", () => {
  const { container } = render(<FamilyTree />);
  const generations = () =>
    container.querySelectorAll("[data-generation-node]");
  expect(generations()).toHaveLength(2);
  for (const [relationship, count] of [
    ["second_cousins", 4],
    ["first_cousins_once_removed", 3],
    ["double_first_cousins", 4],
    ["unrelated", 0],
    ["not_sure", 0],
  ] as const) {
    fireEvent.change(screen.getByLabelText(ui.relationship), {
      target: { value: relationship },
    });
    expect(generations()).toHaveLength(count);
  }
  expect(model).not.toHaveBeenCalled();
});
it("renders the residual gold number and native bar bounds without rounding or client risk arithmetic", async () => {
  model.mockResolvedValue(
    result({
      c: number(1, 25),
      d: number(9, 10),
      posterior_carrier: number(1, 241),
    }),
  );
  render(<NegativeBar />);
  fireEvent.click(screen.getByRole("button", { name: ui.calculate }));
  const after = await screen.findByRole("meter", {
    name: `Model carrier chance: ${ui.after}`,
  });
  expect(after).toHaveAttribute("value", "1");
  expect(after).toHaveAttribute("max", "241");
  const before = screen.getByRole("meter", {
    name: `Model carrier chance: ${ui.before}`,
  });
  expect(before).toHaveAttribute("max", "25");
  expect(screen.getByText("241")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(ui.teaching_detection), {
    target: { value: "1" },
  });
  expect(screen.queryByText("241")).not.toBeInTheDocument();
  model.mockRejectedValueOnce(new Error("offline"));
  fireEvent.click(screen.getByRole("button", { name: ui.calculate }));
  expect(await screen.findByRole("alert")).toHaveTextContent(ui.api_error);
  expect(screen.queryByRole("meter")).not.toBeInTheDocument();
});
it("does not show a late result for a changed teaching selection", async () => {
  let resolve!: (value: RiskEnvelope) => void;
  model.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render(<FamilyTree />);
  fireEvent.click(screen.getByRole("button", { name: ui.calculate }));
  fireEvent.change(screen.getByLabelText(ui.relationship), {
    target: { value: "unrelated" },
  });
  resolve(result({ related: number(7, 123), unrelated: number(1, 321) }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: ui.calculate })).toBeEnabled(),
  );
  expect(screen.queryByText("123")).not.toBeInTheDocument();
  expect(
    within(screen.getByRole("figure")).getByText(
      /Unrelated in this teaching tree/,
    ),
  ).toBeInTheDocument();
});
