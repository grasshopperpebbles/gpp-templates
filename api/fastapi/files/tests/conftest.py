"""Shared fixtures. No real Postgres or Redis is needed: the app's Postgres
engine is created lazily (never connects here), Redis is replaced per test,
and the `db` fixture swaps get_db for an in-memory SQLite database.

Tests never see the project's .env or the shell/container environment: the
shared `settings` object is rebuilt below from TEST_SETTINGS alone, before any
other app module imports it, and every Settings field is removed from the
environment for each test."""
from __future__ import annotations

import os
from collections.abc import AsyncIterator, Iterator

import pytest

from app.core import config

# The values the suite asserts against. Nothing comes from .env or os.environ.
TEST_SETTINGS = {
    "DEBUG": False,
    "ENVIRONMENT": "test",
    "DATABASE_URL": "postgresql+psycopg://postgres:postgres@localhost:5432/postgres",
    "JWT_SECRET": "test-secret-not-for-production-0123456789",
    "JWT_ALGORITHM": "HS256",
    "CORS_ORIGINS": "http://localhost:3000,http://localhost:3001",
    "REDIS_URL": "redis://localhost:6379/0",
}
SETTINGS_FIELDS = tuple(config.Settings.model_fields)


def _isolated_settings() -> config.Settings:
    saved = {k: os.environ.pop(k) for k in SETTINGS_FIELDS if k in os.environ}
    try:
        return config.Settings(_env_file=None, **TEST_SETTINGS)
    finally:
        os.environ.update(saved)


# Must run before app.main, app.db.base etc. do `from app.core.config import settings`.
config.settings = _isolated_settings()

from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core import redis as redis_module  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.models import User  # noqa: F401, E402  (registers the table on Base.metadata)
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

assert redis_module.settings is config.settings, "app imported settings before conftest"


@pytest.fixture(autouse=True)
def _clean_environment(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Settings(...) built inside a test sees no inherited env vars."""
    for name in SETTINGS_FIELDS:
        monkeypatch.delenv(name, raising=False)
    yield


class FakeRedis:
    """Stand-in for redis.asyncio.Redis with a controllable ping()."""

    def __init__(self, healthy: bool = True) -> None:
        self.healthy = healthy

    async def ping(self) -> bool:
        if not self.healthy:
            raise ConnectionError("redis down")
        return True

    async def aclose(self) -> None:
        pass


@pytest.fixture
def fake_redis(monkeypatch: pytest.MonkeyPatch) -> FakeRedis:
    """Route app.core.redis.get_redis() to a FakeRedis (healthy by default)."""
    fake = FakeRedis()
    monkeypatch.setattr(redis_module, "get_redis", lambda: fake)
    return fake


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    """Fresh in-memory SQLite schema per test, wired into the app via get_db."""
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield sessions
    finally:
        app.dependency_overrides.pop(get_db, None)
        await engine.dispose()
