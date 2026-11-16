import hashlib
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator

from app.p05.panel import GeneSymbol, PublicModel, PublicSource, ReferenceValues, load_panel

PATH = Path(__file__).resolve().parents[5] / "data/public/panel/reference-values-v1.json"


class Entry(PublicModel):
    gene_symbol: GeneSymbol
    population: Literal["unspecified"]
    reference_values: ReferenceValues


class References(PublicModel):
    version: Literal["gen-reference-1.0.0"]
    entries: list[Entry] = Field(min_length=1, max_length=40)
    sources: list[PublicSource] = Field(max_length=40)
    review_note: str = Field(min_length=30, max_length=1000)

    @model_validator(mode="after")
    def integrity(self) -> "References":
        keys = [(e.gene_symbol, e.population) for e in self.entries]
        if len(keys) != len(set(keys)):
            raise ValueError("duplicate_population_entry")
        genes = {g.gene_symbol for g in load_panel().panel.genes}
        sources = {s.id for s in self.sources}
        if len(sources) != len(self.sources):
            raise ValueError("duplicate_source")
        for entry in self.entries:
            if entry.gene_symbol not in genes:
                raise ValueError("gene_unsupported")
            for ref in entry.reference_values.model_dump().values():
                if ref["source_id"] and ref["source_id"] not in sources:
                    raise ValueError("source_missing")
                if ref["value"] is not None:
                    # No number with an unspecified population can enter this release.
                    raise ValueError("named_population_required")
        return self


@dataclass(frozen=True)
class LoadedReferences:
    data: References
    hash: str


@lru_cache(maxsize=1)
def load_references() -> LoadedReferences:
    if PATH.is_symlink():
        raise ValueError("local_reference_required")
    with PATH.open("rb") as source:
        raw = source.read(65537)
    if len(raw) > 65536:
        raise ValueError("reference_bound")
    return LoadedReferences(References.model_validate_json(raw), hashlib.sha256(raw).hexdigest())
