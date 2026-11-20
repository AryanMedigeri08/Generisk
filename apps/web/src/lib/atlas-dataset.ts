import {
  districts,
  facilities,
  facilityOperations,
  journeys,
  referrals,
  serviceKeys,
} from "./care-atlas.ts";

const datasetId = "aman-atlas-synthetic-1";

function createDistricts() {
  return districts.flatMap((district) =>
    Array.from({ length: 4 }, (_, index) => ({
      id: district.id + "-" + (index + 1),
      district: district.id,
      name: district.name + " zone " + (index + 1),
      population:
        Math.floor(district.population / 4) +
        (index < district.population % 4 ? 1 : 0),
      x: district.center.x + (index % 2 === 0 ? -1 : 1) * 21,
      y: district.center.y + (index < 2 ? -1 : 1) * 14,
    })),
  );
}

export function generateAtlasDataset() {
  const zones = createDistricts();
  const sites = facilities.flatMap((facility, facilityIndex) =>
    Array.from({ length: 5 }, (_, index) => {
      const id = facility.id + "-" + (index + 1);
      return {
        id,
        name: "Simulated " + facility.name + " " + (index + 1),
        district: facility.district,
        x: facility.point.x + (index - 2) * 7,
        y: facility.point.y + ((index % 3) - 1) * 8,
        services:
          index === 0
            ? [...facility.services]
            : [
                ...new Set([
                  ...facility.services,
                  serviceKeys[(index + facilityIndex) % serviceKeys.length],
                ]),
              ],
        languages: facility.languages,
        stepFree: facility.stepFree,
        ...facilityOperations(id),
      };
    }),
  );
  const connections = [
    ...referrals.flatMap((edge) =>
      Array.from({ length: 5 }, (_, index) => ({
        from: edge.from + "-" + (index + 1),
        to: edge.to + "-" + (index + 1),
        kind: "between-service",
        label: edge.label,
      })),
    ),
    ...facilities.flatMap((facility) =>
      Array.from({ length: 5 }, (_, index) => ({
        from: facility.id + "-" + (index + 1),
        to: facility.id + "-" + (((index + 1) % 5) + 1),
        kind: "same-service",
        label: "Another fictional site for the same service",
      })),
    ),
  ];
  const profiles = Array.from({ length: 1000 }, (_, index) => ({
    id: "syn-person-" + String(index + 1).padStart(4, "0"),
    zone: zones[index % zones.length].id,
    journey: journeys[index % journeys.length].id,
    // Scenario labels only. No variants, demographic attributes or account links.
    reportScenario: [
      "screening-demo",
      "shared-carrier-demo",
      "uncertain-demo",
      "follow-up-demo",
    ][Math.floor(index / 3) % 4],
  }));
  const genetics = profiles.slice(0, 600).map((profile, index) => ({
    id: "syn-teaching-report-" + (index + 1),
    profile: profile.id,
    gene: ["CFTR", "HBB", "PAH"][index % 3],
    status: [
      "carrier",
      "no_pathogenic_variant_detected",
      "variant_uncertain",
      "not_tested",
    ][Math.floor(index / 3) % 4],
    synthetic: true,
  }));
  const pathways = profiles.slice(0, 240).map((profile, index) => ({
    id: "syn-path-" + (index + 1),
    profile: profile.id,
    journey: profile.journey,
    steps: journeys
      .find((journey) => journey.id === profile.journey)!
      .steps.map((step) => step.service),
  }));
  const scenarios = zones.map((zone, index) => ({
    id: "syn-policy-" + (index + 1),
    zone: zone.id,
    radiusKm: [5, 7, 10, 15][index % 4],
    service: serviceKeys[index % serviceKeys.length],
    telehealthDemo: index % 4 === 0,
  }));
  return {
    datasetId,
    synthetic: true,
    zones,
    sites,
    connections,
    profiles,
    genetics,
    pathways,
    scenarios,
  };
}

type Dataset = ReturnType<typeof generateAtlasDataset>;

function coordinates(x: number, y: number) {
  // Invented projection for exchange-format demonstrations only.
  return [54.15 + x / 2000, 24.62 - y / 2200];
}

export function atlasGeoJSON(dataset: Dataset) {
  return {
    type: "FeatureCollection",
    name: dataset.datasetId,
    synthetic: true,
    features: [
      ...dataset.zones.map(({ x, y, ...zone }) => {
        const corners = [
          [x - 17, y - 12],
          [x + 17, y - 12],
          [x + 17, y + 12],
          [x - 17, y + 12],
          [x - 17, y - 12],
        ].reverse();
        return {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [corners.map(([a, b]) => coordinates(a, b))],
          },
          properties: { ...zone, kind: "district-zone", fictional: true },
        };
      }),
      ...dataset.sites.map(({ x, y, ...site }) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: coordinates(x, y) },
        properties: { ...site, kind: "facility", fictional: true },
      })),
      ...dataset.connections.map((edge) => {
        const a = dataset.sites.find((site) => site.id === edge.from)!;
        const b = dataset.sites.find((site) => site.id === edge.to)!;
        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [coordinates(a.x, a.y), coordinates(b.x, b.y)],
          },
          properties: { ...edge, fictional: true },
        };
      }),
    ],
  };
}

export type Table = Exclude<keyof Dataset, "datasetId" | "synthetic">;
export const atlasTables = [
  "zones",
  "sites",
  "connections",
  "profiles",
  "genetics",
  "pathways",
  "scenarios",
] as const satisfies readonly Table[];

function cell(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function atlasCsv(dataset: Dataset, table: Table) {
  const rows = dataset[table];
  const keys = Object.keys(rows[0]);
  return (
    [
      keys.join(","),
      ...rows.map((row) =>
        Object.values(row)
          .map((value) => '"' + cell(value).replaceAll('"', '""') + '"')
          .join(","),
      ),
    ].join("\r\n") + "\r\n"
  );
}

export function atlasSql(dataset: Dataset) {
  const schema = [
    "CREATE TABLE zones (id text PRIMARY KEY, district text NOT NULL, name text NOT NULL, population integer NOT NULL CHECK (population > 0), x real NOT NULL, y real NOT NULL);",
    "CREATE TABLE sites (id text PRIMARY KEY, name text NOT NULL, district text NOT NULL, x real NOT NULL, y real NOT NULL, services json NOT NULL, languages json NOT NULL, step_free boolean NOT NULL, wait_days integer NOT NULL, capacity integer NOT NULL);",
    "CREATE TABLE connections (origin text REFERENCES sites(id), destination text REFERENCES sites(id), kind text NOT NULL, label text NOT NULL, PRIMARY KEY (origin,destination));",
    "CREATE TABLE profiles (id text PRIMARY KEY, zone text NOT NULL REFERENCES zones(id), journey text NOT NULL, report_scenario text NOT NULL);",
    "CREATE TABLE genetics (id text PRIMARY KEY, profile text NOT NULL REFERENCES profiles(id), gene text NOT NULL, status text NOT NULL, synthetic boolean NOT NULL CHECK (synthetic));",
    "CREATE TABLE pathways (id text PRIMARY KEY, profile text NOT NULL REFERENCES profiles(id), journey text NOT NULL, steps json NOT NULL);",
    "CREATE TABLE scenarios (id text PRIMARY KEY, zone text NOT NULL REFERENCES zones(id), radius_km integer NOT NULL, service text NOT NULL, telehealth_demo boolean NOT NULL);",
  ];
  function literal(value: unknown) {
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    return "'" + cell(value).replaceAll("'", "''") + "'";
  }
  return [
    "-- AMAN Genome synthetic fixtures. Load into a disposable PostgreSQL schema.",
    "BEGIN;",
    ...schema,
    ...atlasTables.map(
      (table) =>
        "INSERT INTO " +
        table +
        " VALUES\n" +
        dataset[table]
          .map((row) => "(" + Object.values(row).map(literal).join(", ") + ")")
          .join(",\n") +
        ";",
    ),
    "COMMIT;",
    "",
  ].join("\n");
}
