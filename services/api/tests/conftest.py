import json
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.config import Settings
from app.database import Base, DemoCase
from app.main import create_app


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite+pysqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32))"))
        connection.execute(text("INSERT INTO alembic_version VALUES ('0001_demo')"))
    fixtures = Path(__file__).resolve().parents[3] / "data/synthetic/demo-cases.json"
    with Session(engine) as session, session.begin():
        for row in json.loads(fixtures.read_text(encoding="utf-8")):
            session.add(DemoCase(**row))
    with TestClient(create_app(Settings(database_url="sqlite+pysqlite://"), engine)) as test_client:
        yield test_client
