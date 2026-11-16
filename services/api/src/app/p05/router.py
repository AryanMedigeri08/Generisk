from typing import Annotated

from fastapi import APIRouter, Path

from app.errors import DemoError
from app.p05.panel import SYMBOL_PATTERN, GeneOut, PanelOut, PanelUnavailable, load_panel


def public_panel_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1/panel", tags=["Public reference panel — no personal data"])

    @router.get("", response_model=PanelOut)
    def panel() -> PanelOut:
        try:
            loaded = load_panel()
        except PanelUnavailable as exc:
            raise DemoError(
                503, "PANEL_UNAVAILABLE", "Public reference panel unavailable."
            ) from exc
        return PanelOut(panel_version=loaded.version, panel=loaded.panel)

    @router.get("/{gene_symbol}", response_model=GeneOut)
    def gene(gene_symbol: Annotated[str, Path(pattern=SYMBOL_PATTERN, max_length=15)]) -> GeneOut:
        result = panel()
        entry = next((g for g in result.panel.genes if g.gene_symbol == gene_symbol), None)
        if entry is None:
            raise DemoError(404, "PANEL_GENE_UNAVAILABLE", "Public reference unavailable.")
        source_ids = {entry.symbol_source_id, *(c.source_id for c in entry.conditions)}
        for reference in (
            entry.reference_values.carrier_frequency,
            entry.reference_values.allele_frequency_q,
            entry.reference_values.detection_rate,
        ):
            if reference.source_id:
                source_ids.add(reference.source_id)
        return GeneOut(
            panel_id=result.panel.panel_id,
            panel_version=result.panel_version,
            label=result.panel.label,
            gene=entry,
            sources=[s for s in result.panel.sources if s.id in source_ids],
        )

    return router
