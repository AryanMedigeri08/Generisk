import hashlib
from fractions import Fraction
from pathlib import Path
from typing import Literal

from app.p04.schemas import GeneReport
from app.p05.panel import load_panel
from app.p06.engine.core import F_TABLE, mendelian, population_outcomes, residual
from app.p06.references import load_references
from app.p06.schemas import Bindings, Frequency, GeneResult, Number, RationalOut, Result, WhatIf
from app.schemas import RulesStatus

RULES_VERSION = "gen-rules-1.0.0"
INDEPENDENT = "risk.each_pregnancy_independent"


def digest_sources(sources: list[tuple[str, bytes]]) -> str:
    digest = hashlib.sha256()
    for name, raw in sorted(sources):
        digest.update(name.encode() + b"\0" + raw + b"\0")
    return digest.hexdigest()


def rules_hash() -> str:
    root = Path(__file__).parent
    names = ["engine/core.py", "provider.py", "schemas.py"]
    return digest_sources([(name, (root / name).read_bytes()) for name in names])


def bindings() -> Bindings:
    panel, refs = load_panel(), load_references()
    return Bindings(
        rules_version=RULES_VERSION,
        rules_hash=rules_hash(),
        panel_id=panel.panel.panel_id,
        panel_version=panel.panel.version,
        panel_hash=panel.version,
        reference_values_version=refs.data.version,
        reference_values_hash=refs.hash,
    )


def number(
    value: Fraction, basis: Literal["derived", "sourced", "user_scenario"] = "derived"
) -> Number:
    return Number(
        exact=RationalOut(num=value.numerator, den=value.denominator),
        natural_frequency=Frequency(k=value.numerator, n=value.denominator),
        basis=basis,
    )


def result(state: str, key: str, **kwargs: object) -> Result:
    return Result.model_validate(
        dict(state=state, message_keys=[key, INDEPENDENT], bindings=bindings(), **kwargs)
    )


def gene_result(gene: str, a: str, b: str) -> GeneResult:
    definition = next((g for g in load_panel().panel.genes if g.gene_symbol == gene), None)
    state, key = "UNSUPPORTED", "risk.unsupported"
    if definition is not None:
        if definition.engine_support == "educational_only":
            state, key = "EDUCATIONAL_ONLY_NO_CALCULATION", "risk.educational_only"
        elif "variant_uncertain" in (a, b):
            state, key = "REVIEW_REQUIRED", "risk.review_required"
        elif "not_tested" in (a, b):
            state, key = "UNKNOWN", "risk.unknown"
        elif all(s in {"carrier", "no_pathogenic_variant_detected"} for s in (a, b)):
            count = (a == "carrier") + (b == "carrier")
            state = ["NEITHER_CARRIER", "SINGLE_CARRIER", "SHARED_CARRIER"][count]
            key = ["risk.neither_carrier", "risk.single_carrier", "risk.shared_gene_conditional"][
                count
            ]
            caveats = ["IDEALIZED_STATUS_MODEL", "NEGATIVE_NOT_ZERO_RESIDUAL_UNKNOWN"]
            if count == 2:
                caveats.append("GENE_LEVEL_ONLY")
            return GeneResult(
                gene_symbol=gene,
                state=state,
                message_keys=[key, INDEPENDENT],
                caveat_codes=caveats,
                numbers={
                    k: number(v) for k, v in mendelian(a == "carrier", b == "carrier").items()
                },
            )
    return GeneResult(gene_symbol=gene, state=state, message_keys=[key])


def report_supported(report: GeneReport) -> bool:
    panel = load_panel()
    genes = {g.gene_symbol for g in panel.panel.genes}
    declared = {o.gene_symbol for o in report.observations}
    if report.coverage:
        declared |= set(report.coverage.included_genes) | set(report.coverage.excluded_genes)
    return (
        report.schema_version == "amanah-report-2"
        and report.panel_version == panel.version
        and declared <= genes
    )


def complete(report: GeneReport) -> bool:
    genes = {g.gene_symbol for g in load_panel().panel.genes}
    return bool(
        report.coverage
        and not report.coverage.excluded_genes
        and set(report.coverage.included_genes) == genes
        and {o.gene_symbol for o in report.observations} == genes
        and report.status != "preliminary"
        and all(
            o.validity == "recorded" and o.status not in {"variant_uncertain", "not_tested"}
            for o in report.observations
        )
    )


class EducationalRulesProvider:
    def availability(self) -> RulesStatus:
        # The existing interface continues to deny clinical operation.
        return RulesStatus()

    def evaluate(self, request: WhatIf) -> Result:
        output = self._evaluate(request)
        if request.mode != "mendelian":
            output.population, output.relationship = request.population, request.relationship
        return output

    def _evaluate(self, request: WhatIf) -> Result:
        panel = load_panel()
        gene = next((g for g in panel.panel.genes if g.gene_symbol == request.gene_symbol), None)
        if gene is None:
            return result("UNSUPPORTED", "risk.unsupported")
        if gene.engine_support == "educational_only":
            return result("EDUCATIONAL_ONLY_NO_CALCULATION", "risk.educational_only")
        if request.mode == "mendelian":
            g = gene_result(
                request.gene_symbol,
                request.a_status or "not_tested",
                request.b_status or "not_tested",
            )
            return result(
                g.state,
                g.message_keys[0],
                numbers=g.numbers,
                genes=[g],
                caveat_codes=g.caveat_codes,
            )
        if request.relationship == "not_sure" and request.mode == "consanguinity":
            return result("UNKNOWN", "risk.counsellor_context")
        # Current reference release has no defensible named-population values. Nulls never default.
        if request.mode == "consanguinity":
            if request.q is None:
                return result("UNKNOWN", "risk.reference_unavailable")
            values = population_outcomes(request.q.fraction(), F_TABLE[request.relationship])
            out = result(
                "COMPUTED",
                "risk.population_model",
                numbers={k: number(v) for k, v in values.items()},
                caveat_codes=["SINGLE_ALLELE_POPULATION_MODEL", "USER_SCENARIO_ONLY"],
            )
            out.numbers["q"] = number(request.q.fraction(), "user_scenario")
            return out
        if request.c is None or request.d is None:
            return result("UNKNOWN", "risk.reference_unavailable", couple_state="NOT_COMPUTED")
        posterior_values = {
            "posterior_carrier": number(residual(request.c.fraction(), request.d.fraction())),
            "c": number(request.c.fraction(), "user_scenario"),
            "d": number(request.d.fraction(), "user_scenario"),
        }
        return result(
            "COMPUTED",
            "risk.related_residual_not_modelled"
            if request.relationship != "unrelated"
            else "risk.individual_residual_only",
            numbers=posterior_values,
            couple_state="NOT_COMPUTED",
            caveat_codes=["SAME_SCENARIO_POPULATION", "IDEALIZED_DETECTION_MODEL"],
        )

    def pair(self, a: GeneReport, b: GeneReport) -> Result:
        if not report_supported(a) or not report_supported(b):
            return result("UNSUPPORTED", "risk.unsupported")
        if not complete(a) or not complete(b):
            return result("REVIEW_REQUIRED", "risk.review_required")
        other = {o.gene_symbol: o.status for o in b.observations}
        genes = [
            gene_result(o.gene_symbol, o.status, other[o.gene_symbol])
            for o in sorted(a.observations, key=lambda o: o.gene_symbol)
        ]
        return result("COMPUTED", "risk.covered_model", genes=genes)

    def own(self, report: GeneReport) -> Result:
        if not report_supported(report):
            return result("UNSUPPORTED", "risk.unsupported")
        if not complete(report):
            return result("REVIEW_REQUIRED", "risk.review_required")
        genes = []
        for o in sorted(report.observations, key=lambda o: o.gene_symbol):
            g = gene_result(o.gene_symbol, o.status, "no_pathogenic_variant_detected")
            if g.state in {"SINGLE_CARRIER", "NEITHER_CARRIER"}:
                g.state = "OWN_CARRIER" if o.status == "carrier" else "OWN_NO_FINDING"
                g.message_keys = [
                    "risk.own_carrier" if o.status == "carrier" else "risk.own_no_finding"
                ]
            g.numbers = {}
            genes.append(g)
        return result(
            "COMPUTED",
            "risk.own_status_summary",
            genes=genes,
            caveat_codes=["NEGATIVE_NOT_ZERO_RESIDUAL_UNKNOWN"],
        )
