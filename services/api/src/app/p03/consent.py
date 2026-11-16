from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.identity import Principal
from app.p03.models import Consent
from app.p03.security import now


class DatabaseConsentProvider:
    """Used only inside the serialized sensitive transaction; never caches grants."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def allows(self, principal: Principal, resource_id: str, purpose: str) -> bool:
        consent = self.db.scalar(
            select(Consent).where(
                Consent.user_id == principal.subject_id,
                Consent.scope_key == resource_id,
                Consent.scope == purpose,
            )
        )
        return bool(
            consent
            and consent.state == "granted"
            and consent.expires_at
            and consent.expires_at > now()
        )
