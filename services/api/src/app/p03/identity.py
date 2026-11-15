from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from sqlalchemy.orm import Session

from app.p03.models import DemoSession, DemoUser
from app.p03.security import digest


@dataclass(frozen=True)
class VerifiedIdentity:
    user: DemoUser
    session: DemoSession


class SessionIdentityProvider(Protocol):
    def resolve(self, db: Session, token: str | None, at: datetime) -> VerifiedIdentity | None: ...


class LocalSessionIdentity:
    def resolve(self, db: Session, token: str | None, at: datetime) -> VerifiedIdentity | None:
        if not token or len(token) > 128:
            return None
        record = db.get(DemoSession, digest(token))
        if record is None or record.revoked_at or record.expires_at <= at or not record.user_id:
            return None
        user = db.get(DemoUser, record.user_id)
        if user is None:
            return None
        return VerifiedIdentity(user, record)
