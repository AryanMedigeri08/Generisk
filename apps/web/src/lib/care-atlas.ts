export type Point = Readonly<{ x: number; y: number }>;

export const mapSize = { width: 760, height: 500 };
export const unitsPerKm = 20;
const coast = [
  [0, 188],
  [55, 175],
  [106, 131],
  [153, 146],
  [212, 100],
  [256, 103],
  [293, 51],
  [345, 61],
  [394, 26],
  [434, 44],
  [498, 26],
  [555, 54],
  [585, 30],
  [651, 43],
  [700, 20],
  [760, 38],
] as const;

export const landOutline = [
  ...coast.map(([x, y], index) => (index === 0 ? "M" : "L") + x + " " + y),
  "V500H0Z",
].join(" ");

export function pointOnLand({ x, y }: Point) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (x < 20 || x > mapSize.width - 20 || y > mapSize.height - 20) return false;
  const i = coast.findIndex(([coastX]) => coastX >= x);
  const [leftX, leftY] = coast[i - 1];
  const [rightX, rightY] = coast[i];
  const coastY = leftY + ((rightY - leftY) * (x - leftX)) / (rightX - leftX);
  return y >= coastY + 14;
}
export const services = {
  counselling: { name: "Genetic counselling", color: "#006055", symbol: "C" },
  screening: { name: "Screening", color: "#435d87", symbol: "S" },
  specialist: {
    name: "Specialist consultation",
    color: "#864366",
    symbol: "R",
  },
  diagnostics: { name: "Diagnostic services", color: "#6a5490", symbol: "D" },
  support: { name: "Family support", color: "#875219", symbol: "F" },
  followup: { name: "Follow-up and telehealth", color: "#475858", symbol: "T" },
} as const;

export type Service = keyof typeof services;
export const serviceKeys = Object.keys(services) as Service[];
export const languages = ["English", "Arabic", "Hindi"] as const;
export type Language = (typeof languages)[number];

type District = Readonly<{
  id: string;
  name: string;
  population: number;
  center: Point;
  boundary: string;
}>;

export const districts = [
  {
    id: "harbour",
    name: "Harbour",
    population: 52_000,
    center: { x: 200, y: 188 },
    boundary: "0,0 300,0 303,252 153,241 0,266",
  },
  {
    id: "canal",
    name: "Canal",
    population: 83_000,
    center: { x: 380, y: 174 },
    boundary: "300,0 487,0 509,233 441,252 303,252",
  },
  {
    id: "north",
    name: "North Dunes",
    population: 40_000,
    center: { x: 643, y: 157 },
    boundary: "487,0 760,0 760,241 639,258 509,233",
  },
  {
    id: "garden",
    name: "Garden",
    population: 61_000,
    center: { x: 143, y: 362 },
    boundary: "0,266 153,241 303,252 267,373 247,500 0,500",
  },
  {
    id: "central",
    name: "Central Plain",
    population: 75_000,
    center: { x: 369, y: 328 },
    boundary: "303,252 441,252 509,233 480,365 495,500 247,500 267,373",
  },
  {
    id: "south",
    name: "South Ridge",
    population: 59_000,
    center: { x: 621, y: 394 },
    boundary: "509,233 639,258 760,241 760,500 495,500 480,365",
  },
] as const satisfies readonly District[];

export type DistrictId = (typeof districts)[number]["id"];

type Facility = Readonly<{
  id: string;
  name: string;
  district: DistrictId;
  point: Point;
  services: readonly [Service, ...Service[]];
  languages: readonly Language[];
  stepFree: boolean;
}>;

export const facilities: readonly Facility[] = [
  {
    id: "harbour-screen",
    name: "Harbour Screening Studio",
    district: "harbour",
    point: { x: 157, y: 196 },
    services: ["screening"],
    languages: ["English", "Arabic"],
    stepFree: true,
  },
  {
    id: "harbour-counsel",
    name: "Harbour Genetics Centre",
    district: "harbour",
    point: { x: 240, y: 161 },
    services: ["counselling", "screening"],
    languages: ["English", "Arabic"],
    stepFree: true,
  },
  {
    id: "canal-counsel",
    name: "Canal Counselling Centre",
    district: "canal",
    point: { x: 352, y: 150 },
    services: ["counselling", "followup"],
    languages: ["English", "Arabic", "Hindi"],
    stepFree: true,
  },
  {
    id: "canal-specialist",
    name: "Canal Specialist Hub",
    district: "canal",
    point: { x: 456, y: 184 },
    services: ["specialist"],
    languages: ["English", "Arabic"],
    stepFree: true,
  },
  {
    id: "north-screen",
    name: "North Dunes Screening Point",
    district: "north",
    point: { x: 598, y: 121 },
    services: ["screening"],
    languages: ["English", "Arabic"],
    stepFree: false,
  },
  {
    id: "north-lab",
    name: "North Dunes Diagnostics",
    district: "north",
    point: { x: 669, y: 202 },
    services: ["diagnostics"],
    languages: ["English", "Hindi"],
    stepFree: true,
  },
  {
    id: "garden-support",
    name: "Garden Family Resource House",
    district: "garden",
    point: { x: 106, y: 324 },
    services: ["support"],
    languages: ["English", "Arabic", "Hindi"],
    stepFree: true,
  },
  {
    id: "garden-screen",
    name: "Garden Screening Point",
    district: "garden",
    point: { x: 207, y: 382 },
    services: ["screening"],
    languages: ["English", "Arabic"],
    stepFree: true,
  },
  {
    id: "central-counsel",
    name: "Central Plain Care Centre",
    district: "central",
    point: { x: 390, y: 318 },
    services: ["counselling", "followup"],
    languages: ["English", "Arabic"],
    stepFree: true,
  },
  {
    id: "central-lab",
    name: "Central Plain Diagnostics",
    district: "central",
    point: { x: 449, y: 386 },
    services: ["diagnostics"],
    languages: ["English", "Hindi"],
    stepFree: false,
  },
  {
    id: "south-specialist",
    name: "South Ridge Specialist Studio",
    district: "south",
    point: { x: 581, y: 342 },
    services: ["specialist"],
    languages: ["English", "Hindi"],
    stepFree: true,
  },
  {
    id: "south-support",
    name: "South Ridge Community House",
    district: "south",
    point: { x: 663, y: 424 },
    services: ["support", "followup"],
    languages: ["English", "Arabic"],
    stepFree: true,
  },
];

export const referrals = [
  {
    from: "harbour-screen",
    to: "harbour-counsel",
    label: "Discuss a screening result",
  },
  {
    from: "harbour-counsel",
    to: "canal-specialist",
    label: "Explore specialist support",
  },
  {
    from: "north-screen",
    to: "canal-counsel",
    label: "Discuss screening questions",
  },
  {
    from: "canal-counsel",
    to: "canal-specialist",
    label: "Explore specialist support",
  },
  {
    from: "canal-specialist",
    to: "north-lab",
    label: "Ask about diagnostic services",
  },
  {
    from: "garden-screen",
    to: "central-counsel",
    label: "Discuss screening questions",
  },
  {
    from: "central-counsel",
    to: "garden-support",
    label: "Explore family resources",
  },
  {
    from: "central-counsel",
    to: "south-specialist",
    label: "Explore specialist support",
  },
  {
    from: "south-specialist",
    to: "central-lab",
    label: "Ask about diagnostic services",
  },
  {
    from: "south-specialist",
    to: "south-support",
    label: "Explore follow-up support",
  },
] as const;

export type JourneyStep = Readonly<{ service: Service; prompt: string }>;

const counselling: JourneyStep = {
  service: "counselling",
  prompt:
    "Prepare questions about what a fictional result covers, what remains uncertain and how consent works.",
};
const specialist: JourneyStep = {
  service: "specialist",
  prompt:
    "Explore what a specialist consultation could cover if a counsellor discusses this option with you.",
};
const followup: JourneyStep = {
  service: "followup",
  prompt:
    "Consider questions to bring to a follow-up conversation and which support format you would prefer.",
};
const support: JourneyStep = {
  service: "support",
  prompt:
    "Explore ways to find educational resources and support for a family conversation.",
};

export const journeys: readonly {
  id: string;
  name: string;
  steps: readonly JourneyStep[];
}[] = [
  {
    id: "result",
    name: "Preparing to discuss a result",
    steps: [counselling, specialist, followup],
  },
  {
    id: "screening",
    name: "Learning about screening",
    steps: [
      {
        service: "screening",
        prompt:
          "Ask what screening covers, how results are communicated and how you can make an independent choice.",
      },
      counselling,
      support,
    ],
  },
  {
    id: "follow-up",
    name: "Exploring follow-up support",
    steps: [support, followup, counselling],
  },
];

export function distanceKm(from: Point, to: Point) {
  return Math.hypot(to.x - from.x, to.y - from.y) / unitsPerKm;
}

export function findServices(
  service: Service,
  origin: Point,
  language: Language | "",
  stepFree: boolean,
) {
  return facilities
    .filter(
      (facility) =>
        facility.services.includes(service) &&
        (!language || facility.languages.includes(language)) &&
        (!stepFree || facility.stepFree),
    )
    .map((facility) => ({
      facility,
      distance: distanceKm(origin, facility.point),
    }))
    .sort(
      (a, b) =>
        a.distance - b.distance || a.facility.id.localeCompare(b.facility.id),
    );
}

export function simulateAccess(
  service: Service,
  radius: number,
  proposal?: Point | readonly Point[],
  options: {
    roadEstimate?: boolean;
    telehealth?: boolean;
    maxWaitDays?: number;
  } = {},
) {
  const proposed = proposal ? ("x" in proposal ? [proposal] : proposal) : [];
  const sites = facilities.filter((facility) =>
    facility.services.includes(service),
  );
  const factor = options.roadEstimate ? 1.35 : 1;
  const maxWait = options.maxWaitDays ?? Infinity;
  const eligible = sites.filter(
    (site) => facilityOperations(site.id).waitDays <= maxWait,
  );
  const totalPopulation = districts.reduce(
    (sum, district) => sum + district.population,
    0,
  );
  let baselineReached = 0;
  let afterReached = 0;
  let baselineDistance = 0;
  let afterDistance = 0;
  const areas = districts.map((district) => {
    const before =
      factor *
      Math.min(...sites.map((site) => distanceKm(district.center, site.point)));
    const eligibleBefore =
      factor *
      Math.min(
        ...eligible.map((site) => distanceKm(district.center, site.point)),
      );
    const proposedDistance =
      factor *
      Math.min(...proposed.map((point) => distanceKm(district.center, point)));
    const after = Math.min(before, proposedDistance);
    const coveredBefore = eligibleBefore <= radius;
    const coveredAfter =
      Math.min(eligibleBefore, maxWait >= 3 ? proposedDistance : Infinity) <=
      radius;
    const remoteReached =
      !coveredAfter && options.telehealth && supportsRemote(service)
        ? Math.floor(district.population * 0.6)
        : 0;
    if (coveredBefore) baselineReached += district.population;
    afterReached += coveredAfter ? district.population : remoteReached;
    baselineDistance += before * district.population;
    afterDistance += after * district.population;
    return {
      ...district,
      before,
      after,
      coveredBefore,
      coveredAfter,
      remoteReached,
    };
  });
  return {
    areas,
    reached: [baselineReached, afterReached] as const,
    coverage: [
      baselineReached / totalPopulation,
      afterReached / totalPopulation,
    ] as const,
    meanDistance: [
      baselineDistance / totalPopulation,
      afterDistance / totalPopulation,
    ] as const,
    totalPopulation,
    appointmentCapacity: [
      eligible.reduce(
        (sum, site) => sum + facilityOperations(site.id).capacity,
        0,
      ),
      eligible.reduce(
        (sum, site) => sum + facilityOperations(site.id).capacity,
        0,
      ) +
        (maxWait >= 3 ? 240 * proposed.length : 0) +
        (options.telehealth && supportsRemote(service) ? 360 : 0),
    ] as const,
  };
}

export function supportsRemote(service: Service) {
  return (
    service === "counselling" || service === "followup" || service === "support"
  );
}

export function facilityOperations(id: string) {
  const seed = Array.from(id).reduce(
    (sum, letter) => sum + letter.charCodeAt(0),
    0,
  );
  return { waitDays: 3 + (seed % 15), capacity: 120 + 30 * (seed % 8) };
}
