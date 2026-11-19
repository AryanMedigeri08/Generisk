from fastapi import APIRouter, Request
from sqlalchemy.engine import Engine

from app.config import Settings
from app.errors import DemoError
from app.modules.clinical_rules import ClinicalRulesProvider
from app.p03.service import run
from app.p06.provider import EducationalRulesProvider
from app.p06.schemas import Result, Unavailable, WhatIf
from app.p06.service import couple_assessment, own_assessment


def create_risk_router(engine: Engine, config: Settings) -> APIRouter:
    router = APIRouter(prefix="/api/v1/risk", tags=["Synthetic educational arithmetic"])

    @router.post("/whatif", response_model=Result)
    async def whatif(request: Request) -> Result:
        if not request.headers.get("content-type", "").startswith("application/json"):
            raise DemoError(422, "VALIDATION_ERROR", "risk.input_rejected")
        raw = bytearray()
        async for chunk in request.stream():
            raw.extend(chunk)
            if len(raw) > 4096:
                raise DemoError(413, "VALIDATION_ERROR", "risk.input_rejected")
        try:
            body = WhatIf.model_validate_json(bytes(raw))
        except ValueError as exc:
            raise DemoError(422, "VALIDATION_ERROR", "risk.input_rejected") from exc
        provider: ClinicalRulesProvider = EducationalRulesProvider()
        return provider.evaluate(body)

    @router.get("/my-assessment", response_model=Result)
    def own(request: Request) -> Result:
        return run(engine, config, request, "risk_own", "educational_risk", own_assessment)

    @router.get("/couple-assessment", response_model=Result | Unavailable)
    def couple(request: Request) -> Result | Unavailable:
        return run(engine, config, request, "risk_couple", "educational_risk", couple_assessment)

    return router
