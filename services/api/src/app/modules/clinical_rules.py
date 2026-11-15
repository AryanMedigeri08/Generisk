from typing import Protocol

from app.schemas import RulesStatus


class ClinicalRulesProvider(Protocol):
    def availability(self) -> RulesStatus: ...


class UnavailableClinicalRules:
    def availability(self) -> RulesStatus:
        return RulesStatus()
