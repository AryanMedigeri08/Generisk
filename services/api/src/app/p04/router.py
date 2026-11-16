from collections.abc import Callable
from typing import TypeVar

from fastapi import APIRouter, Request
from sqlalchemy.engine import Engine

from app.config import Settings
from app.p03.service import Context, run
from app.p04 import service
from app.p04.schemas import (
    AmendIn,
    ContentOut,
    FixtureOut,
    HistoryOut,
    ImportIn,
    Receipt,
    ReportOut,
    SelectIn,
)

T = TypeVar("T")


def create_report_router(engine: Engine, config: Settings) -> APIRouter:
    router = APIRouter(prefix="/api/v1/reports", tags=["Synthetic P04 reports only"])

    def execute(request: Request, action: str, operation: Callable[[Context], T]) -> T:
        return run(
            engine,
            config,
            request,
            action,
            "synthetic_report",
            operation,
            mutation=request.method == "POST",
        )

    @router.get("/fixtures", response_model=list[FixtureOut])
    def fixtures(request: Request) -> list[FixtureOut]:
        return execute(request, "report_fixtures", service.fixtures)

    @router.get("/gene-fixtures", response_model=list[FixtureOut])
    def gene_fixtures(request: Request) -> list[FixtureOut]:
        return execute(
            request, "report_fixtures", lambda ctx: service.fixtures(ctx, "amanah-report-2")
        )

    @router.get("", response_model=list[ReportOut])
    def reports(request: Request) -> list[ReportOut]:
        return execute(request, "report_list", service.reports)

    @router.post("/import", response_model=Receipt)
    def import_report(body: ImportIn, request: Request) -> Receipt:
        return execute(request, "report_import", lambda ctx: service.import_report(ctx, body))

    @router.post("/scenario", response_model=Receipt)
    def select_scenario(body: ImportIn, request: Request) -> Receipt:
        return execute(
            request, "report_scenario", lambda ctx: service.import_report(ctx, body, scenario=True)
        )

    @router.post("/amend", response_model=Receipt)
    def amend_report(body: AmendIn, request: Request) -> Receipt:
        return execute(
            request, "report_amend", lambda ctx: service.import_report(ctx, body, amendment=True)
        )

    @router.post("/view", response_model=ContentOut)
    def view(body: SelectIn, request: Request) -> ContentOut:
        return execute(request, "report_content", lambda ctx: service.content(ctx, body))

    @router.post("/versions", response_model=ReportOut)
    @router.post("/provenance", response_model=ReportOut)
    def versions(body: SelectIn, request: Request) -> ReportOut:
        return execute(request, "report_provenance", lambda ctx: service.versions(ctx, body))

    @router.get("/history", response_model=list[HistoryOut])
    def history(request: Request) -> list[HistoryOut]:
        return execute(request, "report_history", service.history)

    return router
