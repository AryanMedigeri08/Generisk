// Only these published teaching fixtures enter the public guided example.
import aCarrier from "../../../../data/synthetic/reports/valid/a-v2-carrier-cftr.json";
import aNone from "../../../../data/synthetic/reports/valid/a-v2-none.json";
import bCarrier from "../../../../data/synthetic/reports/valid/b-v2-carrier-cftr.json";
import bNone from "../../../../data/synthetic/reports/valid/b-v2-none.json";
import bGap from "../../../../data/synthetic/reports/valid/b-v2-cftr-not-tested.json";
import bUncertain from "../../../../data/synthetic/reports/valid/b-v2-uncertain-cftr.json";

type Example = typeof aCarrier;
export type SampleStatus =
  "carrier" | "no_finding" | "not_tested" | "uncertain";
function readSample(report: Example): SampleStatus {
  if (!report.synthetic || report.schema_version !== "amanah-report-2")
    throw new Error("Invalid teaching fixture");
  const observation = report.observations.find((o) => o.gene_symbol === "CFTR");
  if (
    !report.coverage.included_genes.includes("CFTR") ||
    !observation ||
    observation.status === "not_tested"
  )
    return "not_tested";
  if (
    observation.validity !== "recorded" ||
    observation.status === "variant_uncertain"
  )
    return "uncertain";
  if (observation.status === "carrier") return "carrier";
  if (observation.status === "no_pathogenic_variant_detected")
    return "no_finding";
  throw new Error("Unsupported teaching example");
}
export const sampleChoices = {
  first: [readSample(aCarrier), readSample(aNone)],
  second: [
    readSample(bCarrier),
    readSample(bNone),
    readSample(bGap),
    readSample(bUncertain),
  ],
};
export function comparison(a: SampleStatus, b: SampleStatus) {
  if ([a, b].some((s) => s === "not_tested" || s === "uncertain"))
    return "incomplete";
  return a === "carrier" && b === "carrier" ? "shared" : "no_match";
}
