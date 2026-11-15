from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Principal:
    subject_id: str


class AuthenticationProvider(Protocol):
    def authenticate(self, authorization: str | None) -> Principal | None: ...


class UnavailableAuthentication:
    """No token, development header or claimed role can grant access in P02."""

    def authenticate(self, authorization: str | None) -> Principal | None:
        return None
