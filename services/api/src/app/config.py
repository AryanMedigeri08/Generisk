from __future__ import annotations

import re
from urllib.parse import urlsplit

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AMANAH_", env_file=".env", extra="ignore", hide_input_in_errors=True
    )

    database_url: str = (
        "postgresql+psycopg://amanah_demo:demo-local-only@127.0.0.1:15432/amanah_demo"
    )
    demo_only: bool = True
    hosted_demo: bool = False
    web_origin: str = "http://localhost:13000"
    cookie_secure: bool = False
    session_ttl_seconds: int = Field(default=1800, ge=60, le=86400)
    invitation_ttl_seconds: int = Field(default=600, ge=60, le=3600)
    consent_ttl_seconds: int = Field(default=1800, ge=60, le=86400)
    login_limit: int = Field(default=5, ge=1, le=20)
    invitation_limit: int = Field(default=5, ge=1, le=20)
    rate_window_seconds: int = Field(default=60, ge=10, le=600)

    @field_validator("database_url", mode="before")
    @classmethod
    def select_psycopg_driver(cls, value: str) -> str:
        for prefix in ("postgresql://", "postgres://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value[len(prefix) :]
        return value

    @model_validator(mode="after")
    def require_demo_mode(self) -> Settings:
        if not self.demo_only:
            raise ValueError("Only synthetic demonstration mode is supported.")
        if not self.database_url.startswith(("postgresql+psycopg://", "sqlite")):
            raise ValueError("Unsupported database driver.")
        origin = urlsplit(self.web_origin)
        if self.hosted_demo:
            if (
                origin.scheme != "https"
                or not re.fullmatch(r"[a-z0-9-]+(?:\.[a-z0-9-]+)+", origin.hostname or "")
                or origin.hostname == "127.0.0.1"
                or self.web_origin != f"https://{origin.hostname}"
            ):
                raise ValueError("Set a single canonical HTTPS frontend origin.")
            if not self.database_url.startswith("postgresql+psycopg://"):
                raise ValueError("Hosted demonstrations require PostgreSQL.")
        elif origin.hostname not in {"localhost", "127.0.0.1"} or origin.scheme not in {
            "http",
            "https",
        }:
            raise ValueError("Only a loopback demo web origin is supported.")
        if origin.path or origin.query or origin.fragment or origin.username:
            raise ValueError("Origin must not include a path or credentials.")
        if self.cookie_secure != (origin.scheme == "https"):
            raise ValueError("Secure cookies must match the configured HTTP/HTTPS demo origin.")
        return self
