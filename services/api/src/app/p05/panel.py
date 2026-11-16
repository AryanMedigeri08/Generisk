import hashlib
from dataclasses import dataclass
from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

SYMBOL_PATTERN = r"^[A-Z][A-Z0-9]{1,14}$"
GeneSymbol = Annotated[str, Field(pattern=SYMBOL_PATTERN, max_length=15)]
PANEL_LABEL = "Generisk demo panel, illustrative subset, NOT the Abu Dhabi clinical panel."
PANEL_PATH = Path(__file__).resolve().parents[5] / "data/public/panel/demo-panel-v1.json"


class PublicModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid", strict=True, hide_input_in_errors=True, allow_inf_nan=False
    )


class PublicSource(PublicModel):
    id: str = Field(pattern=r"^[a-z0-9-]+$", max_length=80)
    title: str = Field(min_length=5, max_length=180)
    url: HttpUrl
    retrieved_on: date
    field: str = Field(min_length=5, max_length=250)
    license_url: HttpUrl
    license_note: str = Field(min_length=20, max_length=500)

    @model_validator(mode="after")
    def public_links(self) -> "PublicSource":
        for url in (self.url, self.license_url):
            if url.scheme != "https" or url.username or url.password:
                raise ValueError("Only attributed public HTTPS sources")
        return self


class ReferenceValue(PublicModel):
    value: float | None = Field(ge=0, le=1)
    basis: Literal["sourced", "illustrative"]
    source_id: str | None
    note: str = Field(min_length=15, max_length=350)

    @model_validator(mode="after")
    def attribution(self) -> "ReferenceValue":
        if self.basis == "sourced" and (self.value is None or not self.source_id):
            raise ValueError("A sourced number needs a value and exact source")
        return self


class ReferenceValues(PublicModel):
    carrier_frequency: ReferenceValue
    allele_frequency_q: ReferenceValue
    detection_rate: ReferenceValue


class Condition(PublicModel):
    name_en: str = Field(min_length=4, max_length=120)
    name_ar: None
    inheritance: Literal["autosomal_recessive"]
    severity_band: Literal["variable"]
    summary: str = Field(min_length=20, max_length=280)
    source_id: str


class PanelGene(PublicModel):
    gene_symbol: GeneSymbol
    hgnc_id: str = Field(pattern=r"^HGNC:[1-9][0-9]+$")
    symbol_source_id: str
    conditions: list[Condition] = Field(min_length=1, max_length=3)
    engine_support: Literal["supported", "educational_only"]
    support_note: str = Field(min_length=20, max_length=350)
    reference_values: ReferenceValues


class DemoPanel(PublicModel):
    panel_id: Literal["gen-panel-demo-v1"]
    version: Literal["1.0.0"]
    label: Literal["Generisk demo panel, illustrative subset, NOT the Abu Dhabi clinical panel."]
    curated_on: date
    disclaimer: str = Field(min_length=30, max_length=350)
    genes: list[PanelGene] = Field(min_length=12, max_length=20)
    sources: list[PublicSource] = Field(min_length=1, max_length=60)

    @model_validator(mode="after")
    def integrity(self) -> "DemoPanel":
        if len({g.gene_symbol for g in self.genes}) != len(self.genes):
            raise ValueError("Duplicate gene symbol")
        if len({g.hgnc_id for g in self.genes}) != len(self.genes):
            raise ValueError("Duplicate HGNC identifier")
        sources = {source.id: source for source in self.sources}
        if len(sources) != len(self.sources):
            raise ValueError("Duplicate source identifier")
        condition_count = sum(len(g.conditions) for g in self.genes)
        if not 12 <= condition_count <= 20:
            raise ValueError("Demo subset requires 12 to 20 condition references")
        for gene in self.genes:
            names = [c.name_en.casefold() for c in gene.conditions]
            if len(set(names)) != len(names):
                raise ValueError("Duplicate condition")
            refs = [gene.symbol_source_id, *(c.source_id for c in gene.conditions)]
            for reference in (
                gene.reference_values.carrier_frequency,
                gene.reference_values.allele_frequency_q,
                gene.reference_values.detection_rate,
            ):
                if reference.source_id:
                    refs.append(reference.source_id)
            if any(ref not in sources for ref in refs):
                raise ValueError("Missing attributed source")
            if (
                gene.gene_symbol in {"CYP21A2", "SMN1"}
                and gene.engine_support != "educational_only"
            ):
                raise ValueError("Complex genes are educational only")
        return self


@dataclass(frozen=True)
class LoadedPanel:
    panel: DemoPanel
    version: str


class PanelUnavailable(Exception):
    pass


@lru_cache(maxsize=1)
def load_panel() -> LoadedPanel:
    try:
        if PANEL_PATH.is_symlink():
            raise ValueError("Packaged panel must be local")
        with PANEL_PATH.open("rb") as source:
            raw = source.read(131073)
        if len(raw) > 131072:
            raise ValueError("Panel byte bound")
        panel = DemoPanel.model_validate_json(raw)
    except (OSError, ValueError) as exc:
        raise PanelUnavailable("Public reference panel unavailable") from exc
    return LoadedPanel(panel, hashlib.sha256(raw).hexdigest())


class PanelOut(BaseModel):
    panel_version: str
    panel: DemoPanel


class GeneOut(BaseModel):
    panel_id: str
    panel_version: str
    label: str
    gene: PanelGene
    sources: list[PublicSource]
