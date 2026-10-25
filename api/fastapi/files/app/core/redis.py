"""Async Redis client, created lazily and closed on shutdown.

Redis is optional: with REDIS_URL empty, or without the `redis` package
installed (gpp drops it from requirements.txt when a recipe opts out of
Redis), get_redis() returns None and /health reports "disabled". The package
is imported only when a client is first needed, never at module load."""
from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from redis.asyncio import Redis

_client: Redis | None = None


def _redis_class() -> type[Redis] | None:
    """redis.asyncio.Redis, or None when the package is not installed."""
    try:
        from redis.asyncio import Redis
    except ImportError:
        return None
    return Redis


def get_redis() -> Redis | None:
    """Return the shared client, or None when Redis is disabled (REDIS_URL
    empty or the `redis` package not installed)."""
    global _client
    if not settings.REDIS_URL.strip():
        return None
    if _client is None:
        redis_cls = _redis_class()
        if redis_cls is None:
            return None
        _client = redis_cls.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _client


async def close_redis() -> None:
    """Close the shared client if one was created."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def redis_status() -> str:
    """'ok', 'unavailable' (ping failed) or 'disabled' (REDIS_URL empty or
    the `redis` package not installed)."""
    client = get_redis()
    if client is None:
        return "disabled"
    try:
        await client.ping()
    except Exception:
        return "unavailable"
    return "ok"
