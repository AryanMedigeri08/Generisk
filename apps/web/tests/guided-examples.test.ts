import { it, expect, vi, afterEach } from "vitest";
import { sampleChoices, comparison } from "../src/lib/guided-examples";
import { buildGuide } from "../src/lib/atlas-guide";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("reads published fixture statuses and only shows the shared teaching model for two recorded carriers", () => {
  expect(sampleChoices.first).toEqual(["carrier", "no_finding"]);
  expect(sampleChoices.second).toEqual([
    "carrier",
    "no_finding",
    "not_tested",
    "uncertain",
  ]);
  for (const a of sampleChoices.first)
    for (const b of sampleChoices.second) {
      expect(comparison(a, b)).toBe(
        b === "not_tested" || b === "uncertain"
          ? "incomplete"
          : a === "carrier" && b === "carrier"
            ? "shared"
            : "no_match",
      );
    }
});
it("uses Groq only to select public reading and discards unexpected text", async () => {
  vi.stubEnv("GROQ_API_KEY", "test-placeholder");
  vi.stubEnv("GROQ_MODEL", "test-model");
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      Response.json({
        choices: [
          { message: { content: JSON.stringify({ context: "scope" }) } },
        ],
      }),
    )
    .mockResolvedValueOnce(
      Response.json({ choices: [{ message: { content: "Unexpected text" } }] }),
    );
  vi.stubGlobal("fetch", fetcher);
  expect(await buildGuide("inheritance", "en")).toEqual({
    ids: ["inheritance", "scope"],
    mode: "assisted",
  });
  expect(await buildGuide("inheritance", "en")).toEqual({
    ids: ["inheritance", "scope"],
    mode: "assisted",
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  const input = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
  expect(
    JSON.parse(input.messages[1].content).cards.map(
      (c: { id: string }) => c.id,
    ),
  ).toEqual(["inheritance", "scope", "counselling"]);
  expect(await buildGuide("scope", "ar")).toEqual({
    ids: ["scope", "counselling"],
    mode: "curated",
  });
});
