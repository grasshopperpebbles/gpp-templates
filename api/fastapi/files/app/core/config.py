"""Application configuration using Pydantic Settings."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


DEV_ENVIRONMENTS = {"development", "dev", "local", "test"}


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    # "production" (default) refuses to start with a placeholder JWT_SECRET;
    # "development"/"dev"/"local"/"test" (or DEBUG=true) allow it.
    ENVIRONMENT: str = "production"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

    # Auth/JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS: comma-separated origins (e.g. "http://localhost:3000,http://localhost:3001")
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # Redis: empty string disables it. In Docker use redis://<slug>-redis:6379/0
    REDIS_URL: str = "redis://localhost:6379/0"

    @property
    def is_dev(self) -> bool:
        """True for DEBUG or a development/test ENVIRONMENT."""
        return self.DEBUG or self.ENVIRONMENT.strip().lower() in DEV_ENVIRONMENTS

    @property
    def cors_origins(self) -> list[str]:
        """CORS_ORIGINS split into a list."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()


def check_secret_for_production(s: Settings | None = None) -> None:
    """Raise if JWT_SECRET is empty or a "change-me" placeholder outside dev.
    Called on startup, so a production deploy fails fast instead of signing
    tokens with a publicly known secret."""
    s = s or settings
    if s.is_dev:
        return
    secret = s.JWT_SECRET.strip()
    if not secret or secret.lower().startswith("change-me"):
        raise RuntimeError(
            "JWT_SECRET is unset or still the placeholder from env.example.txt. "
            "Set a strong random secret (e.g. `python -c \"import secrets; "
            "print(secrets.token_urlsafe(48))\"`), or set ENVIRONMENT=development "
            f"for local work. Current ENVIRONMENT={s.ENVIRONMENT!r}, DEBUG={s.DEBUG}."
        )

