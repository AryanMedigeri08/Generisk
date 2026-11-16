from sqlalchemy import Boolean, CheckConstraint, String, create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

HEAD_REVISION = "0003_reports"


class Base(DeclarativeBase):
    pass


class DemoCase(Base):
    __tablename__ = "demo_cases"
    __table_args__ = (CheckConstraint("is_synthetic = true", name="synthetic_only"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(80))
    scenario: Mapped[str] = mapped_column(String(240))
    locale: Mapped[str] = mapped_column(String(2))
    demo_status: Mapped[str] = mapped_column(String(40))
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


def make_engine(url: str) -> Engine:
    if url.startswith("sqlite"):
        return create_engine(url, pool_pre_ping=True)
    return create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 3})


def database_ready(engine: Engine) -> bool:
    try:
        with engine.connect() as connection:
            revision = connection.scalar(text("SELECT version_num FROM alembic_version"))
            sample = connection.scalar(text("SELECT id FROM demo_cases LIMIT 1"))
            return revision == HEAD_REVISION and sample is not None
    except SQLAlchemyError:
        return False
