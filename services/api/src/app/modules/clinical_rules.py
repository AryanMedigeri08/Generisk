from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from app.p06.schemas import Result, WhatIf

from app.schemas import RulesStatus


class ClinicalRulesProvider(Protocol):
    def availability(self) -> RulesStatus: ...

    def evaluate(self, request: "WhatIf") -> "Result": ...


class UnavailableClinicalRules:
    def availability(self) -> RulesStatus:
        return RulesStatus()

    def evaluate(self, request: "WhatIf") -> "Result":
        from app.p06.provider import result

        return result("UNSUPPORTED", "risk.unsupported")
