from collections.abc import Callable
from typing import Annotated, TypeVar
from uuid import UUID

from fastapi import APIRouter, Path, Request, Response
from sqlalchemy.engine import Engine

from app.config import Settings
from app.p03 import service as s
from app.p03.schemas import (
    AuditOut,
    CaseOut,
    ConsentIn,
    ConsentOut,
    CsrfOut,
    InviteDecisionIn,
    InviteIn,
    InviteOut,
    JointOut,
    LoginIn,
    PlaceholderOut,
    SessionOut,
    VersionIn,
    WithdrawIn,
)
from app.p03.security import COOKIE_NAME, csrf_for

T = TypeVar("T")
CaseId = Annotated[str, Path(pattern=r"^[a-z0-9-]{1,64}$")]


def create_router(engine: Engine, config: Settings) -> APIRouter:
    router = APIRouter(prefix="/api/v1", tags=["Fictional P03 identity and consent"])

    def execute(
        request: Request,
        action: str,
        operation: Callable[[s.Context], T],
        *,
        mutation: bool = False,
        authenticated: bool = True,
        resource: str | None = None,
    ) -> T:
        return s.run(
            engine,
            config,
            request,
            action,
            "demo_" + action,
            operation,
            authenticated=authenticated,
            mutation=mutation,
            resource=resource,
        )

    def cookie(response: Response, raw: str, seconds: int) -> None:
        response.set_cookie(
            COOKIE_NAME,
            raw,
            max_age=seconds,
            path="/",
            httponly=True,
            secure=config.cookie_secure,
            samesite="lax",
        )

    @router.get("/auth/csrf", response_model=CsrfOut)
    def csrf(request: Request, response: Response) -> CsrfOut:
        raw, record = execute(request, "csrf_challenge", s.challenge, authenticated=False)
        cookie(response, raw, 300)
        return CsrfOut(csrf_token=csrf_for(raw), expires_at=record.expires_at)

    @router.post("/auth/login", response_model=SessionOut)
    def login(body: LoginIn, request: Request, response: Response) -> SessionOut:
        raw, result = execute(request, "login", lambda ctx: s.login(ctx, body), authenticated=False)
        cookie(response, raw, config.session_ttl_seconds)
        return result

    @router.get("/auth/session", response_model=SessionOut)
    def current(request: Request) -> SessionOut:
        return execute(request, "current_session", s.current_session)

    @router.post("/auth/logout")
    def logout(request: Request, response: Response) -> dict[str, bool]:
        result = execute(request, "logout", s.logout, mutation=True)
        response.delete_cookie(
            COOKIE_NAME, path="/", secure=config.cookie_secure, httponly=True, samesite="lax"
        )
        return result

    @router.get("/private/cases/{case_id}", response_model=CaseOut)
    def private_case(case_id: CaseId, request: Request) -> CaseOut:
        return execute(
            request, "case_access", lambda ctx: s.case_metadata(ctx, case_id), resource=case_id
        )

    @router.get("/me/cases", response_model=list[CaseOut])
    def own_cases(request: Request) -> list[CaseOut]:
        return execute(request, "own_cases", s.own_cases)

    @router.get("/professional/cases", response_model=list[CaseOut])
    def professional_cases(request: Request) -> list[CaseOut]:
        return execute(request, "professional_access", s.professional_cases)

    @router.post("/invitations", response_model=InviteOut)
    def create_invite(body: InviteIn, request: Request) -> InviteOut:
        return execute(
            request, "invitation_create", lambda ctx: s.create_invitation(ctx, body), mutation=True
        )

    @router.get("/me/invitations", response_model=list[InviteOut])
    def invitation_list(request: Request) -> list[InviteOut]:
        return execute(request, "invitation_list", s.invitations)

    @router.get("/invitations/{invitation_id}", response_model=InviteOut)
    def invitation(invitation_id: UUID, request: Request) -> InviteOut:
        return execute(
            request,
            "invitation_inspect",
            lambda ctx: s.inspect_invitation(ctx, str(invitation_id)),
            resource=str(invitation_id),
        )

    @router.post("/invitations/{invitation_id}/decision", response_model=InviteOut)
    def decide_invite(invitation_id: UUID, body: InviteDecisionIn, request: Request) -> InviteOut:
        return execute(
            request,
            "invitation_decide",
            lambda ctx: s.decide_invitation(ctx, str(invitation_id), body.token, body.decision),
            mutation=True,
            resource=str(invitation_id),
        )

    @router.get("/me/consents", response_model=list[ConsentOut])
    def consents(request: Request) -> list[ConsentOut]:
        return execute(request, "own_permissions", s.own_consents)

    @router.post("/me/consents", response_model=ConsentOut)
    @router.post("/private/consents", response_model=ConsentOut)
    def decide_consent(request: Request, body: ConsentIn | None = None) -> ConsentOut:
        def operation(ctx: s.Context) -> ConsentOut:
            if body is None:
                s.fail(422, "VALIDATION_ERROR", "A scoped demonstration choice is required.")
            assert body is not None
            return s.decide_consent(ctx, body)

        return execute(request, "consent_decide", operation, mutation=True)

    @router.post("/me/consents/{consent_id}/withdraw", response_model=ConsentOut)
    def withdraw(consent_id: UUID, body: WithdrawIn, request: Request) -> ConsentOut:
        return execute(
            request,
            "consent_withdraw",
            lambda ctx: s.withdraw_consent(ctx, str(consent_id), body),
            mutation=True,
            resource=str(consent_id),
        )

    @router.get("/me/joints", response_model=list[JointOut])
    def joints(request: Request) -> list[JointOut]:
        return execute(request, "joint_list", s.joints)

    @router.get("/joints/{joint_id}/status", response_model=JointOut)
    def joint_status(joint_id: UUID, request: Request) -> JointOut:
        return execute(
            request,
            "joint_authorization",
            lambda ctx: s.joint_view(ctx, s.member_joint(ctx, str(joint_id))),
            resource=str(joint_id),
        )

    @router.get("/joints/{joint_id}/output", response_model=PlaceholderOut)
    def output(joint_id: UUID, request: Request) -> PlaceholderOut:
        return execute(
            request,
            "placeholder_disclosure",
            lambda ctx: s.placeholder(ctx, str(joint_id)),
            resource=str(joint_id),
        )

    @router.post("/private/cases/{case_id}/demo-version", response_model=CaseOut)
    def supersede(case_id: CaseId, body: VersionIn, request: Request) -> CaseOut:
        return execute(
            request,
            "demo_version",
            lambda ctx: s.supersede_case(ctx, case_id, body.expected_version),
            mutation=True,
            resource=case_id,
        )

    @router.get("/me/audit", response_model=list[AuditOut])
    def own_audit(request: Request) -> list[AuditOut]:
        return execute(request, "own_audit", s.own_audit)

    return router
