from __future__ import annotations

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AMANAH_", env_file=".env", extra="ignore")

    database_url: str = (
        "postgresql+psycopg://amanah_demo:demo-local-only@127.0.0.1:15432/amanah_demo"
    )
    demo_only: bool = True

    @model_validator(mode="after")
    def require_demo_mode(self) -> Settings:
        if not self.demo_only:
            raise ValueError("Only synthetic demonstration mode is supported.")
        if not self.database_url.startswith(("postgresql+psycopg://", "sqlite")):
            raise ValueError("Unsupported database driver.")
        return self
