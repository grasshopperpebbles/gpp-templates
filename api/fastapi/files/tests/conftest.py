"""Shared fixtures. No real Postgres or Redis is needed: the DB engine is
created lazily (never connects here) and Redis is replaced per test."""
from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from app.core import redis as redis_module
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
