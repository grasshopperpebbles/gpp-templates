"""
Cache Utility Module

Provides caching functionality with Redis (optional) or in-memory fallback.
Install Redis support: pip install redis>=5.0.0

Usage:
    from app.core.cache import cache, cached

    # Set a value (TTL in seconds)
    await cache.set("key:123", value, ttl=600)

    # Get a value
    value = await cache.get("key:123")

    # Delete a value
    await cache.delete("key:123")

    # Delete all keys matching pattern (supports * wildcard)
    await cache.delete_pattern("user:*")        # All user keys
    await cache.delete_pattern("product:*")     # All product keys

    # Use decorator for function caching
    @cached(ttl=300)
    async def get_data(data_id: str):
        # This result will be cached for 5 minutes
        return await fetch_from_database(data_id)
"""

from __future__ import annotations

import json
import hashlib
import functools
from typing import Any, Callable, TypeVar, ParamSpec
from datetime import datetime, timedelta

# Try to import Redis, fall back to in-memory if not available
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.core.config import settings


P = ParamSpec("P")
T = TypeVar("T")


class InMemoryCache:
    """Simple in-memory cache for development/testing."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, datetime | None]] = {}

    async def get(self, key: str) -> Any | None:
        """Get value from cache."""
        if key not in self._store:
            return None

        value, expires_at = self._store[key]

        if expires_at and datetime.now() > expires_at:
            del self._store[key]
            return None

        return value

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Set value in cache with optional TTL (seconds)."""
        expires_at = datetime.now() + timedelta(seconds=ttl) if ttl else None
        self._store[key] = (value, expires_at)

    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        self._store.pop(key, None)

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching pattern (supports * wildcard)."""
        # Simple wildcard support for in-memory cache
        if "*" in pattern:
            prefix, suffix = pattern.split("*", 1)
            keys_to_delete = [
                key for key in list(self._store.keys())
                if key.startswith(prefix) and (not suffix or key.endswith(suffix))
            ]
            for key in keys_to_delete:
                self._store.pop(key, None)
        else:
            # Exact match
            self._store.pop(pattern, None)

    async def exists(self, key: str) -> bool:
        """Check if key exists and is not expired."""
        return await self.get(key) is not None

    async def clear(self) -> None:
        """Clear all cached values."""
        self._store.clear()

    async def close(self) -> None:
        """Close connection (no-op for in-memory)."""
        pass


class RedisCache:
    """Redis-backed cache for production."""

    def __init__(self, url: str) -> None:
        self._url = url
        self._client: redis.Redis | None = None

    async def _get_client(self) -> redis.Redis:
        """Lazy initialization of Redis client."""
        if self._client is None:
            self._client = redis.from_url(
                self._url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._client

    async def get(self, key: str) -> Any | None:
        """Get value from cache."""
        client = await self._get_client()
        value = await client.get(key)

        if value is None:
            return None

        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Set value in cache with optional TTL (seconds)."""
        client = await self._get_client()
        serialized = json.dumps(value) if not isinstance(value, str) else value

        if ttl:
            await client.setex(key, ttl, serialized)
        else:
            await client.set(key, serialized)

    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        client = await self._get_client()
        await client.delete(key)

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching pattern (supports * wildcard via SCAN)."""
        client = await self._get_client()
        deleted_count = 0
        
        async for key in client.scan_iter(match=pattern):
            await client.delete(key)
            deleted_count += 1
        
        if deleted_count > 0:
            import logging
            logger = logging.getLogger(__name__)
            logger.debug(f"Deleted {deleted_count} cache keys matching pattern: {pattern}")

    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        client = await self._get_client()
        return await client.exists(key) > 0

    async def clear(self) -> None:
        """Clear all cached values (use with caution)."""
        client = await self._get_client()
        await client.flushdb()

    async def close(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.close()


def _create_cache() -> InMemoryCache | RedisCache:
    """Create appropriate cache backend based on configuration."""
    redis_url = getattr(settings, "REDIS_URL", None)

    if redis_url and REDIS_AVAILABLE:
        return RedisCache(redis_url)

    if redis_url and not REDIS_AVAILABLE:
        import warnings
        warnings.warn(
            "REDIS_URL is set but redis package is not installed. "
            "Using in-memory cache. Install with: pip install 'redis>=5.0.0'"
        )

    return InMemoryCache()


# Global cache instance
cache = _create_cache()


def cached(
    ttl: int = 300,
    key_prefix: str = "",
    key_builder: Callable[..., str] | None = None,
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Decorator to cache function results.
    
    Args:
        ttl: Time to live in seconds (default: 5 minutes)
        key_prefix: Prefix for cache key
        key_builder: Custom function to build cache key from args
    
    Usage:
        @cached(ttl=600)
        async def get_data(data_id: str) -> Data:
            return await db.get_data(data_id)
        
        @cached(ttl=60, key_prefix="items")
        async def list_items(filters: dict, limit: int) -> list[Item]:
            return await db.list_items(filters, limit)
    """

    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default key: prefix:function_name:hash(args)
                arg_hash = hashlib.md5(
                    json.dumps((args, kwargs), sort_keys=True, default=str).encode()
                ).hexdigest()[:16]
                prefix = key_prefix or func.__module__
                cache_key = f"{prefix}:{func.__name__}:{arg_hash}"

            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl=ttl)
            return result

        return wrapper

    return decorator


def invalidate_cache(pattern: str) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Decorator to invalidate cache after function execution.
    
    Usage:
        @invalidate_cache("item:*")
        async def update_item(item_id: str, data: dict) -> Item:
            # After this runs, cache entries matching "item:*" should be cleared
            return await db.update_item(item_id, data)
    """

    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            result = await func(*args, **kwargs)

            # Delete all keys matching pattern (supports wildcards)
            await cache.delete_pattern(pattern)

            return result

        return wrapper

    return decorator

