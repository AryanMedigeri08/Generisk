import { content } from "../../content/loader";
import { MENDELIAN } from "./mendelian";
import type { ModelNumber, RiskEnvelope } from "./risk";
export type Preview = "own" | "couple" | "unavailable";
export function preview(
  kind: Preview,
  label = content.ui.banner,
): RiskEnvelope {
  const base = { contract_version: "gen-risk-1", label };
  if (kind === "unavailable")
    return {
      ...base,
      state: "UNAVAILABLE",
      message_keys: ["risk.unavailable"],
    };
  if (kind === "own")
    return {
      ...base,
      state: "COMPUTED",
      message_keys: ["risk.own_status_summary"],
      genes: [
        {
          gene_symbol: "CFTR",
          state: "OWN_CARRIER",
          message_keys: ["risk.own_carrier"],
          caveat_codes: [],
          numbers: {},
        },
      ],
    };
  const numbers: Record<string, ModelNumber> = Object.fromEntries(
    Object.entries(MENDELIAN).map(([key, value]) => [
      key,
      {
        exact: value,
        natural_frequency: { k: value.num, n: value.den },
        basis: "derived",
      },
    ]),
  );
  return {
    ...base,
    state: "SHARED_CARRIER",
    message_keys: [
      "risk.shared_gene_conditional",
      "risk.each_pregnancy_independent",
    ],
    genes: [
      {
        gene_symbol: "CFTR",
        state: "SHARED_CARRIER",
        caveat_codes: ["GENE_LEVEL_ONLY", "IDEALIZED_STATUS_MODEL"],
        numbers,
      },
    ],
  };
}
