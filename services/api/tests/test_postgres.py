import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError

from app.config import Settings
from app.main import create_app
from app.seed import seed_fixtures


@pytest.mark.integration
def test_postgres_upgrade_seed_read_constraint_and_rollback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL is not set; PostgreSQL integration was not run")
    if not (make_url(url).database or "").endswith("_test"):
        pytest.fail("Refusing destructive migration test: database name must end in _test")
    monkeypatch.setenv("AMANAH_DATABASE_URL", url)
    root = Path(__file__).resolve().parents[3]
    config = Config(str(root / "services/api/alembic.ini"))
    fixture_path = root / "data/synthetic/demo-cases.json"
    engine = create_engine(url)
    command.upgrade(config, "head")
    assert seed_fixtures(url, fixture_path) == 2
    assert seed_fixtures(url, fixture_path) == 2
    with engine.connect() as connection:
        assert connection.scalar(text("SELECT count(*) FROM demo_cases")) == 2
    with TestClient(create_app(Settings(database_url=url))) as client:
        assert client.get("/health/ready").status_code == 200
        assert len(client.get("/api/v1/demo/cases").json()["cases"]) == 2
    with pytest.raises(IntegrityError), engine.begin() as connection:
        connection.execute(text("UPDATE demo_cases SET is_synthetic = false"))
    command.downgrade(config, "base")
    with engine.connect() as connection:
        assert connection.scalar(text("SELECT to_regclass('public.demo_cases')")) is None
    command.upgrade(config, "head")
    assert seed_fixtures(url, fixture_path) == 2
    engine.dispose()
