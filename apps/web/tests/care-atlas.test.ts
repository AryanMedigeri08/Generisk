import { describe, expect, it } from "vitest";
import {
  districts,
  facilities,
  findServices,
  pointOnLand,
  referrals,
  simulateAccess,
} from "../src/lib/care-atlas";

describe("Care Atlas synthetic model", () => {
  it("ranks facilities for a selected service and applies language and step-free filters", () => {
    const origin = districts.find(
      (district) => district.id === "south",
    )!.center;
    const matches = findServices("counselling", origin, "", false);
    expect(matches.map(({ facility }) => facility.id)).toEqual([
      "central-counsel",
      "canal-counsel",
      "harbour-counsel",
    ]);
    expect(
      findServices("counselling", origin, "Hindi", true).map(
        ({ facility }) => facility.id,
      ),
    ).toEqual(["canal-counsel"]);
    expect(findServices("diagnostics", origin, "Arabic", true)).toEqual([]);
  });

  it("calculates aggregate coverage and population-weighted distance from the location of the proposal", () => {
    const south = districts.find((district) => district.id === "south")!;
    const baseline = simulateAccess("counselling", 7);
    const after = simulateAccess("counselling", 7, south.center);
    expect(baseline.totalPopulation).toBe(370_000);
    expect(baseline.reached).toEqual([210_000, 210_000]);
    expect(after.reached).toEqual([210_000, 269_000]);
    expect(after.areas.find((area) => area.id === "south")).toMatchObject({
      after: 0,
      coveredBefore: false,
      coveredAfter: true,
    });
    const north = after.areas.find((area) => area.id === "north")!;
    expect(north.after).toBeLessThan(north.before);
    expect(north.coveredAfter).toBe(false);
    expect(after.meanDistance[0]).toBeCloseTo(6.340536, 5);
    expect(after.meanDistance[1]).toBeCloseTo(4.114822, 5);
    expect(simulateAccess("counselling", 15, south.center).reached[1]).toBe(
      370_000,
    );
  });

  it("keeps referral endpoints valid and excludes water when placing proposals", () => {
    const ids = new Set(facilities.map((facility) => facility.id));
    for (const edge of referrals) {
      expect(ids.has(edge.from) && ids.has(edge.to)).toBe(true);
    }
    expect(districts.every((district) => pointOnLand(district.center))).toBe(
      true,
    );
    expect(pointOnLand({ x: 100, y: 115 })).toBe(false);
    expect(pointOnLand({ x: 730, y: 270 })).toBe(true);
    expect(pointOnLand({ x: 760, y: 300 })).toBe(false);
  });
});
