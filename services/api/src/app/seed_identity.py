import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import Settings
from app.database import make_engine
from app.p03.models import CaseAssignment, CaseOwner, DemoUser
from app.p03.security import PASSWORDS


def seed_accounts(database_url: str) -> int:
    path = Path(__file__).resolve().parents[4] / "data/synthetic/demo-accounts.json"
    accounts = json.loads(path.read_text(encoding="utf-8"))
    engine = make_engine(database_url)
    try:
        with Session(engine) as session, session.begin():
            for account in accounts:
                user = session.get(DemoUser, account["id"])
                if user is None:
                    session.add(
                        DemoUser(
                            id=account["id"],
                            username=account["username"],
                            display_name=account["display_name"],
                            role=account["role"],
                            password_hash=PASSWORDS.hash(account["password"]),
                        )
                    )
                    session.flush()
                if account["case_id"] and session.get(CaseOwner, account["case_id"]) is None:
                    session.add(
                        CaseOwner(
                            case_id=account["case_id"], user_id=account["id"], input_version=1
                        )
                    )
            session.flush()
            key = {"case_id": "syn-case-01", "user_id": "demo-user-counsellor"}
            if session.get(CaseAssignment, key) is None:
                session.add(CaseAssignment(**key, purpose="case_metadata"))
        return len(accounts)
    finally:
        engine.dispose()


if __name__ == "__main__":
    print(f"Provisioned {seed_accounts(Settings().database_url)} fictional local-demo accounts.")
