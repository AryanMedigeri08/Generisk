// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as data } from "../src/app/api/atlas/dataset/route";
import { GET as guide } from "../src/app/api/atlas/guide/route";
import { simulateAccess } from "../src/lib/care-atlas";
import { atlasGeoJSON, generateAtlasDataset } from "../src/lib/atlas-dataset";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("synthetic access expansion", () => {
  it("counts additional physical and virtual reach without double-counting", () => {
    const baseline = simulateAccess("counselling", 7);
    const south = baseline.areas.find((area) => area.id === "south")!;
    const north = baseline.areas.find((area) => area.id === "north")!;
    const proposed = [south.center, north.center];
    const expanded = simulateAccess("counselling", 7, proposed, {
      telehealth: true,
    });
    expect(expanded.reached).toEqual([210000, 345600]);
    expect(
      expanded.areas.find((area) => area.id === "garden")?.remoteReached,
    ).toBe(36600);
    expect(
      expanded.appointmentCapacity[1] - expanded.appointmentCapacity[0],
    ).toBe(840);
    expect(
      simulateAccess("screening", 5, undefined, { telehealth: true }).reached,
    ).toEqual(simulateAccess("screening", 5).reached);
    const detour = simulateAccess("counselling", 7, undefined, {
      roadEstimate: true,
    });
    expect(detour.meanDistance[0]).toBeCloseTo(baseline.meanDistance[0] * 1.35);
    const wait = simulateAccess("counselling", 7, undefined, {
      maxWaitDays: 5,
    });
    expect(wait.appointmentCapacity[0]).toBeLessThan(
      baseline.appointmentCapacity[0],
    );
  });
});

describe("fixture exports and public guide", () => {
  it("generates reproducible records with complete references and bounded downloads", async () => {
    const fixtures = generateAtlasDataset();
    expect(fixtures).toEqual(generateAtlasDataset());
    expect([
      fixtures.zones.length,
      fixtures.sites.length,
      fixtures.connections.length,
      fixtures.profiles.length,
      fixtures.genetics.length,
      fixtures.pathways.length,
      fixtures.scenarios.length,
    ]).toEqual([24, 60, 110, 1000, 600, 240, 24]);
    expect(fixtures.zones.reduce((sum, zone) => sum + zone.population, 0)).toBe(
      370000,
    );
    const pins = new Set(fixtures.sites.map((site) => site.id));
    expect(
      fixtures.connections.every(
        (edge) => pins.has(edge.from) && pins.has(edge.to),
      ),
    ).toBe(true);
    expect(atlasGeoJSON(fixtures).features).toHaveLength(194);
    const response = data(
      new Request("http://localhost/api/atlas/dataset?format=csv&table=zones"),
    );
    expect(response.headers.get("content-disposition")).toContain("zones.csv");
    expect((await response.text()).trim().split("\n")).toHaveLength(25);
    expect(
      data(
        new Request(
          "http://localhost/api/atlas/dataset?format=csv&table=private",
        ),
      ).status,
    ).toBe(400);
  });

  it("returns curated sources without runtime configuration and rejects personal fields", async () => {
    vi.stubEnv("ATLAS_OLLAMA_URL", "");
    const response = await guide(
      new Request("http://localhost/api/atlas/guide?locale=ar&topic=family"),
    );
    expect(await response.json()).toEqual({
      ids: ["family", "counselling"],
      mode: "curated",
    });
    const rejected = await guide(
      new Request(
        "http://localhost/api/atlas/guide?locale=en&topic=family&caseId=syn-person",
      ),
    );
    expect(rejected.status).toBe(400);
  });

  it("uses the optional local model only for a supported public companion ID", async () => {
    vi.stubEnv("ATLAS_OLLAMA_URL", "http://127.0.0.1:11434");
    vi.stubEnv("ATLAS_OLLAMA_MODEL", "demo-model");
    const provider = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ response: '{"context":"family"}' }),
      )
      .mockResolvedValueOnce(
        Response.json({ response: '{"context":"untrusted text"}' }),
      );
    vi.stubGlobal("fetch", provider);
    const url = "http://localhost/api/atlas/guide?locale=en&topic=scope";
    expect(await (await guide(new Request(url))).json()).toEqual({
      ids: ["scope", "family"],
      mode: "assisted",
    });
    expect(String(provider.mock.calls[0][0])).toBe(
      "http://127.0.0.1:11434/api/generate",
    );
    const input = JSON.parse(String(provider.mock.calls[0][1]?.body));
    expect(input.format.properties.context.enum).toEqual([
      "counselling",
      "family",
    ]);
    expect(await (await guide(new Request(url))).json()).toEqual({
      ids: ["scope", "counselling"],
      mode: "curated",
    });
  });
});
