import { FIXED_DRAW_CELLS, type Outcome } from "./mendelian";

// Seeded numerical sampling/counting only; no condition-specific or population arithmetic.
export function generator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state;
  };
}
export function sample(seed: number, count: number): Outcome[] {
  const random = generator(seed);
  return Array.from(
    { length: count },
    () => FIXED_DRAW_CELLS[(random() >>> 16) % FIXED_DRAW_CELLS.length],
  );
}
export function tally(draws: readonly Outcome[]): Record<Outcome, number> {
  return draws.reduce(
    (counts, key) => {
      counts[key] += 1;
      return counts;
    },
    { affected: 0, carrier: 0, neither: 0 },
  );
}
export function tenRuns(seed: number) {
  return Array.from({ length: 10 }, (_, i) => ({
    seed: seed + i,
    counts: tally(sample(seed + i, 100)),
  }));
}

export function makeSampler(seed: number) {
  const random = generator(seed);
  return () => FIXED_DRAW_CELLS[(random() >>> 16) % FIXED_DRAW_CELLS.length];
}
