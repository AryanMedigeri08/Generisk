// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { content, validateLesson, loadContent } from "../src/content/loader";
import schema from "../src/content/card.schema.json";
import {
  MENDELIAN,
  pairTable,
  EXPECTED_AFFECTED_IN_HUNDRED,
} from "../src/lib/learn/mendelian";
import {
  sample,
  tally,
  tenRuns,
  makeSampler,
} from "../src/lib/learn/simulation";

const read = (name: string) =>
  readFileSync(new URL(name, import.meta.url), "utf8");
describe("source-attributed content boundary", () => {
  it("requires metadata, known sources, unreviewed status and a short simple reading level", () => {
    const forbidden =
      /\b(?:compatible|incompatible|normal|abnormal|defective|cancel)\b|bad genes|should(?: not)? marry|avoid marriage|(?:safe|unsafe) couple|will be sick/i;
    expect(content.lessons).toHaveLength(7);
    const cards = content.lessons.flatMap((m) => m.cards);
    expect(cards).toHaveLength(9);
    for (const card of cards) {
      expect(Object.keys(card).sort()).toEqual([...schema.required].sort());
      expect(card.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(card.language).toBe("en");
      expect(card.review_status).toBe("demo-unreviewed");
      expect(card.sources.length).toBeGreaterThan(0);
      expect(schema.properties.widget.enum).toContain(card.widget);
      for (const id of card.sources) {
        const source = content.sources[id as keyof typeof content.sources];
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.retrieved_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(source.license_note.length).toBeGreaterThan(20);
      }
      if (card.reading_level === "simple")
        for (const paragraph of card.body)
          for (const sentence of paragraph.split(/[.!?]+/)) {
            const words =
              sentence.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) ?? [];
            expect(
              words.length,
              `${card.card_id}: ${sentence}`,
            ).toBeLessThanOrEqual(25);
          }
    }
    for (const name of readdirSync(
      new URL("../src/content/en/", import.meta.url),
    )) {
      expect(forbidden.test(read(`../src/content/en/${name}`)), name).toBe(
        false,
      );
    }
    expect(loadContent().lessons).toEqual(content.lessons);
    expect(() => loadContent("ar" as "en")).toThrow(
      "CONTENT_LANGUAGE_UNAVAILABLE",
    );
  });
  it.each([
    "missing-source",
    "unknown-widget",
    "approved",
    "long-title",
    "extra-field",
    "duplicate-card",
  ])("rejects invalid content: %s", (change) => {
    const lesson = structuredClone(content.lessons[0]);
    const raw = lesson.cards[0] as unknown as Record<string, unknown>;
    if (change === "missing-source") raw.sources = [];
    if (change === "unknown-widget") raw.widget = "quiz";
    if (change === "approved") raw.review_status = "reviewed";
    if (change === "long-title") raw.title = "x".repeat(161);
    if (change === "extra-field") raw.unexpected = "fictional";
    if (change === "duplicate-card") lesson.cards.push(lesson.cards[0]);
    expect(() => validateLesson(lesson)).toThrow();
  });
  it("has text for every emitted P06 message, caveat and state", () => {
    const root = new URL("../../../services/api/src/app/p06/", import.meta.url);
    const source = ["provider.py", "service.py", "router.py", "schemas.py"]
      .map((n) => readFileSync(new URL(n, root), "utf8"))
      .join("\n");
    const keys = [...new Set(source.match(/risk\.[a-z_]+/g))].sort();
    expect(Object.keys(content.risk.messages).sort()).toEqual(keys);
    const caveats = new Set<string>();
    for (const match of source.matchAll(
      /(?:caveats\s*=\s*|caveat_codes\s*=\s*)(\[[\s\S]*?\])/g,
    ))
      for (const code of match[1].matchAll(/"([A-Z_]+)"/g))
        caveats.add(code[1]);
    for (const match of source.matchAll(/caveats\.append\("([A-Z_]+)"\)/g))
      caveats.add(match[1]);
    expect([...caveats].sort()).toEqual(
      Object.keys(content.risk.caveats).sort(),
    );
    expect(caveats.has("GENE_LEVEL_ONLY")).toBe(true);
    for (const key of [...keys, ...caveats])
      expect(
        (content.risk.messages as Record<string, string>)[key] ??
          (content.risk.caveats as Record<string, string>)[key],
      ).toBeTruthy();
    const states = [
      "COMPUTED",
      "OWN_CARRIER",
      "OWN_NO_FINDING",
      "SHARED_CARRIER",
      "SINGLE_CARRIER",
      "NEITHER_CARRIER",
      "UNKNOWN",
      "REVIEW_REQUIRED",
      "EDUCATIONAL_ONLY_NO_CALCULATION",
      "UNSUPPORTED",
      "NOT_COMPUTED",
      "NO_SHARED_FINDING",
      "UNAVAILABLE",
    ];
    for (const state of states)
      expect(content.risk.states).toHaveProperty(state);
  });
  it("keeps prose in content, omits persistence, and never calculates a population/residual risk in a lesson", () => {
    const dir = new URL("../src/components/learn/", import.meta.url);
    const files = readdirSync(dir).filter((n) => n.endsWith(".tsx"));
    for (const name of files) {
      const source = readFileSync(new URL(name, dir), "utf8");
      expect(source).not.toMatch(
        /localStorage|sessionStorage|indexedDB|sendBeacon|document\.cookie/,
      );
      expect(source).not.toMatch(
        /0\.25|0\.5\b|1\s*(?:\/|in\s+)\s*[24]\b|Math\.(?:random|round)/,
      );
      const ast = ts.createSourceFile(
        name,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      function visit(node: ts.Node) {
        if (ts.isJsxText(node))
          expect(
            node.text.replace(/\s/g, ""),
            `${name}: prose in JSX`,
          ).not.toMatch(/[a-zA-Z]/);
        if (ts.isBinaryExpression(node))
          expect(
            node.operatorToken.kind,
            `${name}: division belongs to the server`,
          ).not.toBe(ts.SyntaxKind.SlashToken);
        if (
          ts.isJsxAttribute(node) &&
          node.initializer &&
          ts.isStringLiteral(node.initializer) &&
          /^aria-label$|^title$|^placeholder$|^alt$/.test(
            node.name.getText(ast),
          )
        )
          expect(node.initializer.text).not.toMatch(/[a-zA-Z]/);
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
    expect(read("../src/lib/learn/risk.ts")).toContain('credentials: "omit"');
    expect(read("../src/app/api/p03/[...path]/route.ts")).not.toContain(
      '"learn"',
    );
    expect(fileURLToPath(dir)).toContain("learn");
  });
});

describe("one fixed Mendelian model and deterministic counting", () => {
  it("has four copy pairs for each preset and a single set of fixed fractions", () => {
    expect(MENDELIAN).toEqual({
      affected: { num: 1, den: 4 },
      carrier: { num: 1, den: 2 },
      neither: { num: 1, den: 4 },
    });
    expect(EXPECTED_AFFECTED_IN_HUNDRED).toBe(25);
    expect(tally(pairTable("both_carriers").map((r) => r.outcome))).toEqual({
      affected: 1,
      carrier: 2,
      neither: 1,
    });
    expect(tally(pairTable("one_carrier").map((r) => r.outcome))).toEqual({
      affected: 0,
      carrier: 2,
      neither: 2,
    });
    expect(tally(pairTable("neither_carrier").map((r) => r.outcome))).toEqual({
      affected: 0,
      carrier: 0,
      neither: 4,
    });
  });
  it("replays seeds, changes runs and produces exactly 100 fictional families in every run", () => {
    expect(sample(20261119, 100)).toEqual(sample(20261119, 100));
    expect(sample(20261119, 100)).not.toEqual(sample(20261120, 100));
    const runs = tenRuns(20261119);
    expect(runs).toHaveLength(10);
    for (const run of runs)
      expect(Object.values(run.counts).reduce((a, b) => a + b, 0)).toBe(100);
    expect(new Set(runs.map((r) => r.counts.affected)).size).toBeGreaterThan(1);
    const next = makeSampler(20261119);
    expect(Array.from({ length: 30 }, next)).toEqual(sample(20261119, 30));
  });
});
