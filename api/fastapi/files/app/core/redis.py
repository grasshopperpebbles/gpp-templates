"""Async Redis client, created lazily and closed on shutdown."""
from __future__ import annotations

from redis.asyncio import Redis

from app.core.config import settings

_client: Redis | None = None


def get_redis() -> Redis | None:
    """Return the shared client, or None when REDIS_URL is empty (Redis disabled)."""
    global _client
    if not settings.REDIS_URL.strip():
        return None
    if _client is None:
        _client = Redis.from_url(
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
    """'ok', 'unavailable' (ping failed) or 'disabled' (REDIS_URL empty)."""
    client = get_redis()
    if client is None:
        return "disabled"
    try:
        await client.ping()
    except Exception:
        return "unavailable"
    return "ok"
