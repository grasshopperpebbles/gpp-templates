"""Application configuration using Pydantic Settings."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


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
    def cors_origins(self) -> list[str]:
        """CORS_ORIGINS split into a list."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()

