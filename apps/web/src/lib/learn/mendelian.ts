export type Copy = "working" | "changed";
export type Outcome = "affected" | "carrier" | "neither";
export type Preset = "both_carriers" | "one_carrier" | "neither_carrier";
// The only client-owned numerical risk model: fixed generic Mendelian constants.
export const MENDELIAN = Object.freeze({
  affected: { num: 1, den: 4 },
  carrier: { num: 1, den: 2 },
  neither: { num: 1, den: 4 },
});
export const PRESETS: Record<
  Preset,
  readonly [readonly [Copy, Copy], readonly [Copy, Copy]]
> = {
  both_carriers: [
    ["working", "changed"],
    ["working", "changed"],
  ],
  one_carrier: [
    ["working", "changed"],
    ["working", "working"],
  ],
  neither_carrier: [
    ["working", "working"],
    ["working", "working"],
  ],
};
export function pairOutcome(a: Copy, b: Copy): Outcome {
  if (a === "changed" && b === "changed") return "affected";
  return a === "changed" || b === "changed" ? "carrier" : "neither";
}
export function pairTable(preset: Preset) {
  const [a, b] = PRESETS[preset];
  return a.flatMap((fromA, ai) =>
    b.map((fromB, bi) => ({
      id: `${ai}-${bi}`,
      fromA,
      fromB,
      outcome: pairOutcome(fromA, fromB),
    })),
  );
}
export const FIXED_DRAW_CELLS = pairTable("both_carriers").map(
  (p) => p.outcome,
);

// Fixed model scaled to the explicitly illustrated hundred-family teaching group.
export const EXPECTED_AFFECTED_IN_HUNDRED = 25;
