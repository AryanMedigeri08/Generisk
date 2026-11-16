from typing import Protocol

from app.modules.identity import Principal


class ConsentProvider(Protocol):
    def allows(self, principal: Principal, resource_id: str, purpose: str) -> bool: ...


class DenyAllConsent:
    def allows(self, principal: Principal, resource_id: str, purpose: str) -> bool:
        return False
