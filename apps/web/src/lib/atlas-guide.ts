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

// At most eight public topic/language pairs. Repeated requests share the same model call.
const groqCards = new Map<
  string,
  { until: number; selection: Promise<TopicId | undefined> }
>();

async function selectPublicCard(
  topic: TopicId,
  locale: DemoLanguage,
  model: string,
  key: string,
) {
  const candidates = publicContext[topic];
  const cacheKey = topic + "/" + locale;
  const previous = groqCards.get(cacheKey);
  if (previous && previous.until > Date.now()) return previous.selection;
  const selection = (async () => {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(3500),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_completion_tokens: 128,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Select the most useful follow-up reading from the candidates. Return JSON with only a context field containing a candidate ID.",
            },
            {
              role: "user",
              content: JSON.stringify({
                topic,
                candidates,
                cards: retrieveGuide([topic, ...candidates]).map((card) => ({
                  id: card.id,
                  summary: card.summary[locale],
                })),
              }),
            },
          ],
        }),
      },
    );
    if (!response.ok) return undefined;
    const body = await response.json();
    const raw = body?.choices?.[0]?.message?.content;
    if (typeof raw !== "string" || raw.length > 128) return undefined;
    const choice = JSON.parse(raw)?.context;
    return candidates.find((id) => id === choice);
  })().catch(() => undefined);
  groqCards.set(cacheKey, { until: Date.now() + 300_000, selection });
  return selection;
}

export async function buildGuide(topic: TopicId, locale: DemoLanguage) {
  const candidates = publicContext[topic];
  const fallback = { ids: [topic, candidates[0]], mode: "curated" as const };
  if (process.env.GROQ_API_KEY && process.env.GROQ_MODEL) {
    const picked = await selectPublicCard(
      topic,
      locale,
      process.env.GROQ_MODEL,
      process.env.GROQ_API_KEY,
    );
    return picked
      ? { ids: [topic, picked], mode: "assisted" as const }
      : fallback;
  }
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
