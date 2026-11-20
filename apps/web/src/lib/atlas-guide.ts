import {
  knowledgeCards,
  retrieveGuide,
  type DemoLanguage,
  type TopicId,
} from "./journey-demo";

const publicContext: Record<TopicId, readonly TopicId[]> = {
  scope: ["counselling", "family"],
  inheritance: ["scope", "counselling"],
  counselling: ["family", "scope"],
  family: ["counselling", "scope"],
};

export function parseGuideRequest(
  params: URLSearchParams,
): { topic: TopicId; locale: DemoLanguage } | undefined {
  if (params.size !== 2) return undefined;
  const topic = knowledgeCards.find(
    (card) => card.id === params.get("topic"),
  )?.id;
  const locale = params.get("locale");
  return topic && (locale === "en" || locale === "ar")
    ? { topic, locale }
    : undefined;
}

export async function buildGuide(topic: TopicId, locale: DemoLanguage) {
  const candidates = publicContext[topic];
  const fallback = { ids: [topic, candidates[0]], mode: "curated" as const };
  const endpoint = process.env.ATLAS_OLLAMA_URL;
  const model = process.env.ATLAS_OLLAMA_MODEL;
  if (!endpoint || !model) return fallback;

  try {
    const local = new URL(endpoint);
    if (
      local.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "host.docker.internal"].includes(
        local.hostname,
      ) ||
      local.pathname !== "/" ||
      local.username ||
      local.password ||
      local.search ||
      local.hash
    )
      return fallback;
    const cards = retrieveGuide([topic, ...candidates]);
    const response = await fetch(new URL("/api/generate", local), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(3500),
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature: 0, num_predict: 32 },
        format: {
          type: "object",
          required: ["context"],
          properties: { context: { type: "string", enum: candidates } },
          additionalProperties: false,
        },
        prompt:
          "Pick a companion educational card for the first card. Return only an object with a context ID from the two companion cards. Public facts:\n" +
          cards.map((card) => card.id + ": " + card.summary[locale]).join("\n"),
      }),
    });
    if (!response.ok) return fallback;
    const modelResponse = await response.json();
    if (
      typeof modelResponse.response !== "string" ||
      modelResponse.response.length > 128
    )
      return fallback;
    const selection = JSON.parse(modelResponse.response) as {
      context?: unknown;
    };
    const supported = candidates.find((id) => id === selection?.context);
    return supported
      ? { ids: [topic, supported], mode: "assisted" as const }
      : fallback;
  } catch {
    return fallback;
  }
}
