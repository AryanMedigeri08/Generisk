from fractions import Fraction
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

LABEL = "Synthetic demonstration. Educational estimate. Not a diagnosis. Not for clinical use."
Relationship = Literal[
    "unrelated",
    "second_cousins",
    "first_cousins_once_removed",
    "first_cousins",
    "double_first_cousins",
    "not_sure",
]
Status = Literal["carrier", "no_pathogenic_variant_detected", "variant_uncertain", "not_tested"]
Population = Literal["user_scenario", "unspecified"]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, hide_input_in_errors=True)


class Exact(Strict):
    num: int = Field(ge=0, le=10**6)
    den: int = Field(ge=1, le=10**6)

    def fraction(self) -> Fraction:
        return Fraction(self.num, self.den)


class WhatIf(Strict):
    mode: Literal["mendelian", "consanguinity", "residual"]
    gene_symbol: str = Field(pattern=r"^[A-Z][A-Z0-9]{1,14}$", max_length=15)
    a_status: Status | None = None
    b_status: Status | None = None
    relationship: Relationship = "unrelated"
    population: Population = "unspecified"
    q: Exact | None = None
    c: Exact | None = None
    d: Exact | None = None

    @model_validator(mode="after")
    def bounds(self) -> "WhatIf":
        if self.mode == "mendelian":
            if self.a_status is None or self.b_status is None or any((self.q, self.c, self.d)):
                raise ValueError("status_inputs_required")
            if self.relationship != "unrelated" or self.population != "unspecified":
                raise ValueError("mode_inputs_only")
        elif self.a_status or self.b_status:
            raise ValueError("mode_inputs_only")
        if self.mode == "consanguinity" and (self.c or self.d):
            raise ValueError("mode_inputs_only")
        if self.mode == "residual" and (self.q or bool(self.c) != bool(self.d)):
            raise ValueError("paired_population_inputs_required")
        if any((self.q, self.c, self.d)) and self.population != "user_scenario":
            raise ValueError("scenario_population_required")
        for value in (self.q, self.c):
            if value and not 0 < value.fraction() < 1:
                raise ValueError("open_probability_bounds")
        if self.d and not 0 <= self.d.fraction() <= 1:
            raise ValueError("detection_bounds")
        return self


class RationalOut(BaseModel):
    num: int
    den: int


class Frequency(BaseModel):
    k: int
    n: int


class Number(BaseModel):
    exact: RationalOut
    natural_frequency: Frequency
    basis: Literal["derived", "sourced", "user_scenario"]


Code = Annotated[str, Field(pattern=r"^[A-Z_]+$")]
Key = Annotated[str, Field(pattern=r"^risk\.[a-z_]+$")]


class GeneResult(BaseModel):
    gene_symbol: str
    state: Code
    message_keys: list[Key]
    caveat_codes: list[Code] = Field(default_factory=list)
    numbers: dict[str, Number] = Field(default_factory=dict)


class Bindings(BaseModel):
    rules_version: str
    rules_hash: str
    panel_id: str
    panel_version: str
    panel_hash: str
    reference_values_version: str
    reference_values_hash: str
    report_id: str | None = None
    revision: int | None = None
    input_version: int | None = None
    scope_hash: str | None = None


class Result(BaseModel):
    contract_version: Literal["gen-risk-1"] = "gen-risk-1"
    state: Code
    message_keys: list[Key]
    label: str = LABEL
    each_pregnancy_independent: Literal[True] = True
    caveat_codes: list[Code] = Field(default_factory=list)
    numbers: dict[str, Number] = Field(default_factory=dict)
    genes: list[GeneResult] = Field(default_factory=list)
    bindings: Bindings
    couple_state: Literal["NOT_COMPUTED"] | None = None
    population: Population | None = None
    relationship: Relationship | None = None


class Unavailable(BaseModel):
    state: Literal["UNAVAILABLE"] = "UNAVAILABLE"
    message_keys: list[str] = Field(default_factory=lambda: ["risk.unavailable"])
    label: str = LABEL
