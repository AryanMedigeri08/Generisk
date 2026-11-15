export type DemoCase = {
  id: string;
  display_name: string;
  scenario: string;
  locale: "en" | "ar";
  demo_status: "foundation_only";
  is_synthetic: true;
};

export type DemoSnapshot = {
  api: "online" | "unavailable";
  database: "ready" | "unavailable";
  cases: DemoCase[];
  knowledge: "unavailable";
};

export const unavailableSnapshot: DemoSnapshot = {
  api: "unavailable",
  database: "unavailable",
  cases: [],
  knowledge: "unavailable",
};

export function parseDemoCases(value: unknown): DemoCase[] {
  if (
    typeof value !== "object" ||
    value === null ||
    !("demo_only" in value) ||
    value.demo_only !== true
  ) {
    throw new Error("The demo response must be explicitly synthetic.");
  }
  if (!("cases" in value) || !Array.isArray(value.cases)) {
    throw new Error("The demo response is invalid.");
  }
  return value.cases.map((row: unknown) => {
    if (
      typeof row !== "object" ||
      row === null ||
      !("id" in row) ||
      typeof row.id !== "string" ||
      !/^syn-[a-z0-9-]+$/.test(row.id) ||
      !("display_name" in row) ||
      typeof row.display_name !== "string" ||
      !("scenario" in row) ||
      typeof row.scenario !== "string" ||
      !("locale" in row) ||
      (row.locale !== "en" && row.locale !== "ar") ||
      !("is_synthetic" in row) ||
      row.is_synthetic !== true ||
      !("demo_status" in row) ||
      row.demo_status !== "foundation_only"
    ) {
      throw new Error("Only fictional foundation fixtures are supported.");
    }
    return {
      id: row.id,
      display_name: row.display_name,
      scenario: row.scenario,
      locale: row.locale,
      is_synthetic: true,
      demo_status: "foundation_only",
    };
  });
}

export async function getDemoSnapshot(): Promise<DemoSnapshot> {
  const base = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:18000";
  try {
    const [live, ready, fixtures] = await Promise.all(
      ["/health/live", "/health/ready", "/api/v1/demo/cases"].map((path) =>
        fetch(`${base}${path}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        }),
      ),
    );
    if (!live.ok) return unavailableSnapshot;
    return {
      api: "online",
      database: ready.ok ? "ready" : "unavailable",
      cases:
        ready.ok && fixtures.ok ? parseDemoCases(await fixtures.json()) : [],
      knowledge: "unavailable",
    };
  } catch {
    return unavailableSnapshot;
  }
}
