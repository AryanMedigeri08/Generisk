import json
from pathlib import Path

from pydantic import TypeAdapter
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import DemoCase, make_engine
from app.schemas import DemoCaseOut


def seed_fixtures(database_url: str, fixture_path: Path) -> int:
    fixtures = TypeAdapter(list[DemoCaseOut]).validate_python(
        json.loads(fixture_path.read_text(encoding="utf-8"))
    )
    engine = make_engine(database_url)
    try:
        with Session(engine) as session, session.begin():
            for fixture in fixtures:
                session.merge(DemoCase(**fixture.model_dump()))
        return len(fixtures)
    finally:
        engine.dispose()


if __name__ == "__main__":
    fixture_file = Path(__file__).resolve().parents[4] / "data/synthetic/demo-cases.json"
    print(f"Seeded {seed_fixtures(Settings().database_url, fixture_file)} fictional fixtures.")
