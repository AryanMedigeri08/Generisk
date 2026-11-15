from typing import Literal, Protocol

from app.schemas import KnowledgeStatus


class KnowledgeProvider(Protocol):
    def availability(self, locale: Literal["en", "ar"]) -> KnowledgeStatus: ...


class EmptyKnowledgeProvider:
    def availability(self, locale: Literal["en", "ar"]) -> KnowledgeStatus:
        return KnowledgeStatus(locale=locale)
