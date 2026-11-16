from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

DOCUMENT = JSON().with_variant(JSONB(), "postgresql")


class ReportRecord(Base):
    __tablename__ = "p04_reports"
    __table_args__ = (
        ForeignKeyConstraint(
            ["case_id", "owner_id"], ["p03_case_owners.case_id", "p03_case_owners.user_id"]
        ),
        UniqueConstraint("owner_id", "source_report_id"),
        ForeignKeyConstraint(
            ["active_revision_id", "id"],
            ["p04_revisions.id", "p04_revisions.report_id"],
            name="fk_p04_active_same_report",
            use_alter=True,
            deferrable=True,
            initially="DEFERRED",
        ),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(64))
    owner_id: Mapped[str] = mapped_column(String(64))
    source_report_id: Mapped[str] = mapped_column(String(70))
    active_revision_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class ReportRevision(Base):
    __tablename__ = "p04_revisions"
    __table_args__ = (
        UniqueConstraint("id", "report_id"),
        UniqueConstraint("report_id", "version"),
        UniqueConstraint("report_id", "source_revision_id"),
        ForeignKeyConstraint(
            ["supersedes_id", "report_id"],
            ["p04_revisions.id", "p04_revisions.report_id"],
            name="fk_p04_predecessor_same_report",
        ),
        CheckConstraint("version >= 1 AND version <= 20"),
        CheckConstraint("validation_state IN ('accepted','review_required')"),
        CheckConstraint("content ->> 'synthetic' = 'true'", name="p04_synthetic_content"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("p04_reports.id"))
    source_revision_id: Mapped[str] = mapped_column(String(70))
    version: Mapped[int] = mapped_column(Integer)
    validation_state: Mapped[str] = mapped_column(String(20))
    supersedes_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    amendment_reason: Mapped[str | None] = mapped_column(String(40), nullable=True)
    content: Mapped[dict[str, Any]] = mapped_column(DOCUMENT)
    source_payload: Mapped[str] = mapped_column(Text)
    source_sha256: Mapped[str] = mapped_column(String(64))
    fixture_id: Mapped[str] = mapped_column(String(56))
    imported_by: Mapped[str] = mapped_column(ForeignKey("p03_users.id"))
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    validated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ImportOutcome(Base):
    __tablename__ = "p04_import_outcomes"
    __table_args__ = (
        UniqueConstraint("actor_id", "idempotency_key"),
        ForeignKeyConstraint(
            ["case_id", "actor_id"], ["p03_case_owners.case_id", "p03_case_owners.user_id"]
        ),
        CheckConstraint(
            "category IN ('accepted','review_required','malformed','unsupported','duplicate')"
        ),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    actor_id: Mapped[str] = mapped_column(String(64))
    case_id: Mapped[str] = mapped_column(String(64))
    operation: Mapped[str] = mapped_column(String(10))
    idempotency_key: Mapped[str] = mapped_column(String(64))
    fingerprint: Mapped[str] = mapped_column(String(64))
    fixture_id: Mapped[str] = mapped_column(String(56))
    source_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    category: Mapped[str] = mapped_column(String(20))
    reason_codes: Mapped[list[str]] = mapped_column(DOCUMENT)
    report_id: Mapped[str | None] = mapped_column(ForeignKey("p04_reports.id"), nullable=True)
    revision_id: Mapped[str | None] = mapped_column(ForeignKey("p04_revisions.id"), nullable=True)
    input_version_after: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
