import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from functools import lru_cache

from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError

COOKIE_NAME = "amanah_demo_session"
PASSWORDS = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2, type=Type.ID)


def now() -> datetime:
    return datetime.now(timezone.utc)


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def new_token() -> str:
    return secrets.token_urlsafe(32)


def csrf_for(token: str) -> str:
    # Domain-separated, reproducible synchronizer token; only its digest is stored.
    return hmac.new(token.encode(), b"amanah-demo-csrf-v1", hashlib.sha256).hexdigest()


@lru_cache(maxsize=1)
def dummy_hash() -> str:
    return PASSWORDS.hash("fictional-unknown-account-timing-value")


def verify_password(encoded: str, supplied: str) -> bool:
    try:
        return PASSWORDS.verify(encoded, supplied)
    except (VerificationError, InvalidHashError):
        return False
