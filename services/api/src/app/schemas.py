from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DemoCaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: str = Field(pattern=r"^syn-[a-z0-9-]+$", max_length=64)
    display_name: str = Field(max_length=80)
    scenario: str = Field(max_length=240)
    locale: Literal["en", "ar"]
    demo_status: Literal["foundation_only"]
    is_synthetic: Literal[True]


class DemoCasesOut(BaseModel):
    demo_only: Literal[True] = True
    disclaimer: str = "Fictional demonstration fixtures. Not patient records or clinical results."
    cases: list[DemoCaseOut]


class KnowledgeStatus(BaseModel):
    status: Literal["unavailable"] = "unavailable"
    reason: Literal["empty_approved_corpus"] = "empty_approved_corpus"
    message: str = "Approved educational knowledge is not available in this demonstration."
    locale: Literal["en", "ar"]
    sources: list[str] = Field(default_factory=list)


class RulesStatus(BaseModel):
    status: Literal["unavailable"] = "unavailable"
    reason: Literal["clinical_rules_not_implemented"] = "clinical_rules_not_implemented"
