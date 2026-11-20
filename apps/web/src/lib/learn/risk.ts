export type Exact = { num: number; den: number };
export type ModelNumber = {
  exact: Exact;
  natural_frequency: { k: number; n: number };
  basis: string;
};
export type RiskGene = {
  gene_symbol: string;
  state: string;
  message_keys?: string[];
  caveat_codes: string[];
  numbers: Record<string, ModelNumber>;
};
export type RiskEnvelope = {
  contract_version?: string;
  state: string;
  label: string;
  message_keys: string[];
  caveat_codes?: string[];
  genes?: RiskGene[];
  numbers?: Record<string, ModelNumber>;
  bindings?: { scope_hash?: string };
  couple_state?: string | null;
  each_pregnancy_independent?: boolean;
};
export type Relationship =
  | "unrelated"
  | "second_cousins"
  | "first_cousins_once_removed"
  | "first_cousins"
  | "double_first_cousins"
  | "not_sure";
export const TEACHING_Q = [
  { num: 1, den: 50 },
  { num: 1, den: 100 },
  { num: 1, den: 200 },
] as const;
export const TEACHING_C = [
  { num: 1, den: 25 },
  { num: 1, den: 50 },
] as const;
export const TEACHING_D = [
  { num: 9, den: 10 },
  { num: 4, den: 5 },
  { num: 1, den: 1 },
] as const;
export async function whatIf(
  body: object,
  signal?: AbortSignal,
): Promise<RiskEnvelope> {
  const response = await fetch("/api/p03/risk/whatif", {
    method: "POST",
    credentials: "omit",
    cache: "no-store",
    signal,
    headers: { "Content-Type": "application/json", "X-Demo-Request": "1" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("WHATIF_UNAVAILABLE");
  const value: unknown = await response.json();
  if (
    !value ||
    typeof value !== "object" ||
    !("contract_version" in value) ||
    value.contract_version !== "gen-risk-1" ||
    !("state" in value) ||
    typeof value.state !== "string" ||
    !("message_keys" in value) ||
    !Array.isArray(value.message_keys)
  )
    throw new Error("WHATIF_UNAVAILABLE");
  return value as RiskEnvelope;
}
