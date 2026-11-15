from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DemoUser(Base):
    __tablename__ = "p03_users"
    __table_args__ = (CheckConstraint("role IN ('individual', 'counsellor', 'support')"),)
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True)
    display_name: Mapped[str] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(255))


class DemoSession(Base):
    __tablename__ = "p03_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("p03_users.id"), nullable=True)
    csrf_hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CaseOwner(Base):
    __tablename__ = "p03_case_owners"
    case_id: Mapped[str] = mapped_column(ForeignKey("demo_cases.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("p03_users.id"), unique=True)
    input_version: Mapped[int] = mapped_column(Integer, default=1)


class CaseAssignment(Base):
    __tablename__ = "p03_assignments"
    case_id: Mapped[str] = mapped_column(ForeignKey("demo_cases.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("p03_users.id"), primary_key=True)
    purpose: Mapped[str] = mapped_column(String(40), default="case_metadata")


class JointReview(Base):
    __tablename__ = "p03_joints"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    a_user_id: Mapped[str] = mapped_column(ForeignKey("p03_users.id"))
    b_user_id: Mapped[str] = mapped_column(ForeignKey("p03_users.id"))
    a_case_id: Mapped[str] = mapped_column(ForeignKey("demo_cases.id"))
    b_case_id: Mapped[str] = mapped_column(ForeignKey("demo_cases.id"))
    a_input_version: Mapped[int] = mapped_column(Integer)
    b_input_version: Mapped[int] = mapped_column(Integer)
    version: Mapped[int] = mapped_column(Integer, default=1)
    output_version: Mapped[int] = mapped_column(Integer, default=1)
    placeholder_reviewed: Mapped[bool] = mapped_column(default=False)


class Invitation(Base):
    __tablename__ = "p03_invitations"
    __table_args__ = (CheckConstraint("state IN ('pending','accepted','declined','expired')"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    sender_id: Mapped[str] = mapped_column(ForeignKey("p03_users.id"))
    recipient_id: Mapped[str] = mapped_column(ForeignKey("p03_users.id"))
    state: Mapped[str] = mapped_column(String(12), default="pending")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    joint_id: Mapped[str | None] = mapped_column(ForeignKey("p03_joints.id"), nullable=True)


class Consent(Base):
    __tablename__ = "p03_consents"
    __table_args__ = (
        UniqueConstraint("user_id", "scope_key"),
        CheckConstraint("scope IN ('processing','assessment','disclosure')"),
        CheckConstraint("state IN ('granted','refused','withdrawn','expired','superseded')"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("p03_users.id"))
    scope: Mapped[str] = mapped_column(String(12))
    scope_key: Mapped[str] = mapped_column(String(160))
    case_id: Mapped[str | None] = mapped_column(ForeignKey("demo_cases.id"), nullable=True)
    joint_id: Mapped[str | None] = mapped_column(ForeignKey("p03_joints.id"), nullable=True)
    target_version: Mapped[int] = mapped_column(Integer)
    state: Mapped[str] = mapped_column(String(12))
    version: Mapped[int] = mapped_column(Integer)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ConsentEvent(Base):
    __tablename__ = "p03_consent_events"
    __table_args__ = (UniqueConstraint("consent_id", "version"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    consent_id: Mapped[str] = mapped_column(ForeignKey("p03_consents.id"))
    version: Mapped[int] = mapped_column(Integer)
    state: Mapped[str] = mapped_column(String(12))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Idempotency(Base):
    __tablename__ = "p03_idempotency"
    user_id: Mapped[str] = mapped_column(ForeignKey("p03_users.id"), primary_key=True)
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    fingerprint: Mapped[str] = mapped_column(String(64))
    consent_id: Mapped[str] = mapped_column(ForeignKey("p03_consents.id"))


class RateBucket(Base):
    __tablename__ = "p03_rate_buckets"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    count: Mapped[int] = mapped_column(Integer)


class AuditEvent(Base):
    __tablename__ = "p03_audit"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("p03_users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(48))
    purpose: Mapped[str] = mapped_column(String(48))
    resource_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    decision: Mapped[str] = mapped_column(String(24))
    version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
