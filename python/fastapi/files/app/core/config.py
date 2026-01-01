from __future__ import annotations

import os

from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_env_file() -> str | None:
    """Return .env path only if file exists and is readable."""
    env_path = ".env"
    if os.path.exists(env_path) and os.access(env_path, os.R_OK):
        return env_path
    return None


class Settings(BaseSettings):
    # Reads apps/api/.env inside the container because WORKDIR=/app and COPY . .
    # Falls back to environment variables if .env is missing or unreadable (e.g., sandbox)
    model_config = SettingsConfigDict(
        env_file=_get_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@db:5432/postgres"

    # Redis (optional - for caching and rate limiting)
    # Install: pip install ".[cache]"
    # Docker: uncomment redis service in docker-compose.yml
    REDIS_URL: str | None = None

    # Auth/JWT
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Admin seed (optional)
    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None


settings = Settings()
