import m1 from "./en/genes-and-copies.json";
import m2 from "./en/carriers.json";
import m3 from "./en/couple-chance.json";
import m4 from "./en/relatives-share-genes.json";
import m5 from "./en/test-limits.json";
import m6 from "./en/options.json";
import m7 from "./en/your-result.json";
import english from "./en/ui.json";
import messages from "./en/risk-messages.json";
import sources from "./en/sources.json";

export const WIDGETS = [
  "gene-keys",
  "next-100",
  "one-pregnancy",
  "family-tree",
  "negative-bar",
  "uncertain-result",
  "options",
  "none",
] as const;
export type Card = {
  card_id: string;
  version: string;
  language: "en";
  reading_level: "simple" | "detail";
  title: string;
  body: string[];
  widget: (typeof WIDGETS)[number];
  sources: string[];
  review_status: "demo-unreviewed";
  source_check: "verified" | "not_verified";
  glossary_terms: string[];
};
export type Lesson = {
  module_id: string;
  module_number: string;
  eyebrow: string;
  title: string;
  summary: string;
  duration: string;
  cards: Card[];
};
export type Language = "en";
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((v) => typeof v === "string" && v.length > 0);
export function validateLesson(value: unknown): Lesson {
  if (
    !record(value) ||
    ![
      "module_id",
      "module_number",
      "eyebrow",
      "title",
      "summary",
      "duration",
    ].every((k) => typeof value[k] === "string" && value[k].length > 0) ||
    !Array.isArray(value.cards) ||
    !value.cards.length
  )
    throw new Error("CONTENT_MODULE_INVALID");
  for (const card of value.cards) {
    if (
      !record(card) ||
      !/^m[1-7]-[a-z0-9-]+$/.test(String(card.card_id)) ||
      !/^\d+\.\d+\.\d+$/.test(String(card.version)) ||
      card.language !== "en" ||
      !["simple", "detail"].includes(String(card.reading_level)) ||
      typeof card.title !== "string" ||
      !card.title ||
      card.title.length > 160 ||
      !strings(card.body) ||
      !card.body.length ||
      card.body.length > 10 ||
      card.body.some((s) => s.length > 1000) ||
      !WIDGETS.includes(card.widget as (typeof WIDGETS)[number]) ||
      !strings(card.sources) ||
      !card.sources.length ||
      !card.sources.every((s) => Object.hasOwn(sources, s)) ||
      card.review_status !== "demo-unreviewed" ||
      !["verified", "not_verified"].includes(String(card.source_check)) ||
      !strings(card.glossary_terms) ||
      !card.glossary_terms.every((t) =>
        Object.hasOwn(english.glossary_entries, t),
      ) ||
      Object.keys(card).some(
        (k) =>
          ![
            "card_id",
            "version",
            "language",
            "reading_level",
            "title",
            "body",
            "widget",
            "sources",
            "review_status",
            "source_check",
            "glossary_terms",
          ].includes(k),
      )
    )
      throw new Error("CONTENT_CARD_INVALID");
  }
  const typed = value as Lesson;
  if (new Set(typed.cards.map((c) => c.card_id)).size !== typed.cards.length)
    throw new Error("CONTENT_DUPLICATE_CARD");
  return typed;
}
const lessons = [m1, m2, m3, m4, m5, m6, m7].map(validateLesson);
export function loadContent(language: Language = "en") {
  if (language !== "en") throw new Error("CONTENT_LANGUAGE_UNAVAILABLE");
  return { lessons, ui: english, risk: messages, sources };
}
export const content = loadContent();
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{([a-z_]+)\}/g, (token, key: string) =>
    String(values[key] ?? token),
  );
}
