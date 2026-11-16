"""Fictional demonstration fixtures only; no patient or genomic schema."""

import sqlalchemy as sa
from alembic import op

revision = "0001_demo"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "demo_cases",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("display_name", sa.String(80), nullable=False),
        sa.Column("scenario", sa.String(240), nullable=False),
        sa.Column("locale", sa.String(2), nullable=False),
        sa.Column("demo_status", sa.String(40), nullable=False),
        sa.Column("is_synthetic", sa.Boolean(), nullable=False),
        sa.CheckConstraint("is_synthetic = true", name="synthetic_only"),
    )


def downgrade() -> None:
    op.drop_table("demo_cases")
