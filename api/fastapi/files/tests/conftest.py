"""Shared fixtures. No real Postgres or Redis is needed: the app's Postgres
engine is created lazily (never connects here), Redis is replaced per test,
and the `db` fixture swaps get_db for an in-memory SQLite database."""
from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core import redis as redis_module
from app.db.base import Base
from app.db.models import User  # noqa: F401  (registers the table on Base.metadata)
from app.db.session import get_db
from app.main import app


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
