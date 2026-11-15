from __future__ import annotations

import logging
import time
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse, Response

from app.config import Settings
from app.database import DemoCase, database_ready, make_engine
from app.errors import DemoError, error_response
from app.modules.clinical_rules import UnavailableClinicalRules
from app.modules.consent import DenyAllConsent
from app.modules.identity import Principal, UnavailableAuthentication
from app.modules.knowledge import EmptyKnowledgeProvider
from app.schemas import DemoCaseOut, DemoCasesOut, KnowledgeStatus

logger = logging.getLogger("amanah.requests")


def require_principal(authorization: Annotated[str | None, Header()] = None) -> Principal:
    principal = UnavailableAuthentication().authenticate(authorization)
    if principal is None:
        raise DemoError(401, "AUTHENTICATION_UNAVAILABLE", "Protected access is disabled in P02.")
    return principal


def create_app(settings: Settings | None = None, engine: Engine | None = None) -> FastAPI:
    config = settings or Settings()
    db = engine or make_engine(config.database_url)

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        yield
        db.dispose()

    application = FastAPI(
        title="Amanah Genetics — synthetic hackathon demonstration",
        version="0.2.0",
        description="Fictional fixtures only. Not for clinical use. Protected access is disabled.",
        lifespan=lifespan,
    )

    @application.middleware("http")
    async def request_metadata(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request.state.request_id = str(uuid4())
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # Deliberately omit exception values, URL, body, headers and connection strings.
            response = error_response(request, 500, "INTERNAL_ERROR", "The demo is unavailable.")
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Demo-Only"] = "true"
        logger.info(
            "request method=%s status=%s duration_ms=%.1f request_id=%s",
            request.method,
            response.status_code,
            (time.perf_counter() - started) * 1000,
            request.state.request_id,
        )
        return response

    @application.exception_handler(DemoError)
    async def demo_error(request: Request, exc: DemoError) -> JSONResponse:
        return error_response(request, exc.status, exc.code, exc.message)

    @application.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return error_response(
            request, 422, "VALIDATION_ERROR", "Unsupported demonstration request."
        )

    @application.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
        return error_response(request, exc.status_code, "HTTP_ERROR", "Resource unavailable.")

    @application.get("/health/live")
    def live() -> dict[str, str | bool]:
        return {"status": "ok", "demo_only": True}

    @application.get("/health/ready")
    def ready() -> dict[str, str | bool]:
        if not database_ready(db):
            raise DemoError(503, "DATABASE_UNAVAILABLE", "The demonstration database is not ready.")
        return {"status": "ok", "database": "ready", "demo_only": True}

    @application.get("/api/v1/demo/cases", response_model=DemoCasesOut)
    def demo_cases() -> DemoCasesOut:
        try:
            with Session(db) as session:
                records = session.scalars(select(DemoCase).order_by(DemoCase.id)).all()
                return DemoCasesOut(cases=[DemoCaseOut.model_validate(row) for row in records])
        except SQLAlchemyError as exc:
            raise DemoError(
                503, "DATABASE_UNAVAILABLE", "The demonstration database is not ready."
            ) from exc

    @application.get("/api/v1/knowledge", response_model=KnowledgeStatus)
    def knowledge(locale: Literal["en", "ar"] = "en") -> KnowledgeStatus:
        return EmptyKnowledgeProvider().availability(locale)

    @application.get("/api/v1/capabilities")
    def capabilities() -> dict[str, bool | str]:
        return {
            "demo_only": True,
            "authentication": False,
            "consent_grants": False,
            "clinical_rules": UnavailableClinicalRules().availability().status,
            "approved_knowledge": False,
            "real_integrations": False,
        }

    @application.get("/api/v1/private/cases/{case_id}")
    def private_case(
        case_id: str, principal: Annotated[Principal, Depends(require_principal)]
    ) -> None:
        if not DenyAllConsent().allows(principal, case_id, "view_case"):
            raise DemoError(403, "ACCESS_DENIED", "Protected access is disabled in P02.")

    @application.post("/api/v1/private/consents")
    def private_consent(principal: Annotated[Principal, Depends(require_principal)]) -> None:
        if not DenyAllConsent().allows(principal, "consent", "grant"):
            raise DemoError(403, "ACCESS_DENIED", "Consent grants are not implemented in P02.")

    return application


app = create_app()
