from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Scope = Literal["processing", "assessment", "disclosure"]
Choice = Literal["grant", "refuse", "withdraw"]
Role = Literal["individual", "counsellor", "support"]


class StrictInput(BaseModel):
    model_config = ConfigDict(extra="forbid", hide_input_in_errors=True)


class LoginIn(StrictInput):
    username: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")
    password: str = Field(min_length=1, max_length=128)


class SessionOut(BaseModel):
    user_id: str
    username: str
    display_name: str
    role: Role
    csrf_token: str
    expires_at: datetime
    demo_only: Literal[True] = True


class CsrfOut(BaseModel):
    csrf_token: str
    expires_at: datetime


class InviteIn(StrictInput):
    recipient_username: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")


class InviteDecisionIn(StrictInput):
    token: str = Field(min_length=20, max_length=128)
    decision: Literal["accept", "decline"]


class InviteOut(BaseModel):
    id: str
    status: str
    joint_id: str | None = None
    delivery_token: str | None = None
    expires_at: datetime | None = None


class ConsentIn(StrictInput):
    scope: Scope
    purpose: Literal["legacy", "educational_risk"] = "legacy"
    case_id: str | None = Field(default=None, max_length=64)
    joint_id: str | None = Field(default=None, max_length=36)
    target_version: int = Field(ge=1)
    audience: Literal["participants"] = "participants"
    decision: Choice
    expected_version: int = Field(ge=0)
    idempotency_key: str = Field(min_length=8, max_length=64, pattern=r"^[a-zA-Z0-9-]+$")


class WithdrawIn(StrictInput):
    expected_version: int = Field(ge=1)
    idempotency_key: str = Field(min_length=8, max_length=64, pattern=r"^[a-zA-Z0-9-]+$")


class VersionIn(StrictInput):
    expected_version: int = Field(ge=1)


class ConsentOut(BaseModel):
    id: str
    scope: str
    scope_key: str
    state: str
    version: int
    target_version: int
    case_id: str | None
    joint_id: str | None
    expires_at: datetime | None
    replayed: bool = False


class CaseOut(BaseModel):
    id: str
    display_name: str
    scenario: str
    input_version: int
    is_synthetic: Literal[True] = True


class JointOut(BaseModel):
    id: str
    version: int
    output_version: int
    status: Literal["available_for_demo_review", "unavailable"]
    can_disclose: bool
    placeholder_reviewed: bool


class PlaceholderOut(BaseModel):
    kind: Literal["non_clinical_placeholder"] = "non_clinical_placeholder"
    output_version: int
    message: str = "Fictional permission-test metadata only. No genetic finding or clinical result."


class AuditOut(BaseModel):
    id: str
    action: str
    purpose: str
    resource_id: str | None
    decision: str
    version: int | None
    created_at: datetime
