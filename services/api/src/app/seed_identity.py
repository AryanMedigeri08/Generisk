import json
import os
from pathlib import Path

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import make_engine
from app.p03.models import CaseAssignment, CaseOwner, DemoSession, DemoUser
from app.p03.security import PASSWORDS, now, verify_password


def hosted_passwords() -> dict[str, str]:
    passwords = {
        f"demo-{role}": os.environ.get(f"AMANAH_PASSWORD_{role.upper()}", "")
        for role in ("a", "b", "counsellor", "support")
    }
    if len(set(passwords.values())) != len(passwords) or any(
        not 24 <= len(value) <= 128 for value in passwords.values()
    ):
        raise ValueError("Configure four distinct hosted demo passwords of 24–128 characters.")
    return passwords


def seed_accounts(database_url: str, *, hosted: bool = False) -> int:
    path = Path(__file__).resolve().parents[4] / "data/synthetic/demo-accounts.json"
    accounts = json.loads(path.read_text(encoding="utf-8"))
    passwords = hosted_passwords() if hosted else {}
    engine = make_engine(database_url)
    try:
        with Session(engine) as session, session.begin():
            for account in accounts:
                password = passwords[account["username"]] if hosted else account["password"]
                user = session.get(DemoUser, account["id"])
                if user is None:
                    session.add(
                        DemoUser(
                            id=account["id"],
                            username=account["username"],
                            display_name=account["display_name"],
                            role=account["role"],
                            password_hash=PASSWORDS.hash(password),
                        )
                    )
                    session.flush()
                elif hosted and not verify_password(user.password_hash, password):
                    user.password_hash = PASSWORDS.hash(password)
                    session.execute(
                        update(DemoSession)
                        .where(DemoSession.user_id == user.id, DemoSession.revoked_at.is_(None))
                        .values(revoked_at=now())
                    )
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
    settings = Settings()
    count = seed_accounts(settings.database_url, hosted=settings.hosted_demo)
    print(f"Provisioned {count} fictional demo accounts.")
