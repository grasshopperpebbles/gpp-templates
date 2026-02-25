"""
Rate Limiting Module

Provides rate limiting for API endpoints with support for:
- In-memory (development) and Redis (production) backends
- Per-user, per-IP, and per-tier limits

Install Redis support: pip install redis>=5.0.0

Usage:
    from app.core.rate_limit import RateLimiter, get_client_identifier

    # Create a limiter
    limiter = RateLimiter(requests=1000, window=3600)  # 1000 requests per hour

    # Use in route
    @router.get("/api/v1/items")
    async def list_items(request: Request):
        identifier = get_client_identifier(request)
        await limiter.check(identifier, request=request)  # Raises RateLimitExceeded if over limit
        # ... process request
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING
from dataclasses import dataclass
from fastapi import Request, HTTPException, status

# Try to import Redis, fall back to in-memory if not available
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.core.config import settings


def is_whitelisted(request: Request) -> bool:
    """
    Check if a request is from a whitelisted source.
    
    Checks API key, IP address, and Origin/Referer domain.
    
    Returns:
        True if request should bypass rate limiting
    """
    # Check API key
    api_key = request.headers.get("x-api-key")
    if api_key and hasattr(settings, "RATE_LIMIT_WHITELIST_API_KEYS"):
        whitelist_keys = getattr(settings, "RATE_LIMIT_WHITELIST_API_KEYS", [])
        if api_key in whitelist_keys:
            return True
    
    # Check IP address
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.headers.get("x-real-ip") or (request.client.host if request.client else None)
    
    if ip and hasattr(settings, "RATE_LIMIT_WHITELIST_IPS"):
        whitelist_ips = getattr(settings, "RATE_LIMIT_WHITELIST_IPS", [])
        if ip in whitelist_ips:
            return True
    
    # Check Origin/Referer domain
    if hasattr(settings, "RATE_LIMIT_WHITELIST_DOMAINS"):
        whitelist_domains = getattr(settings, "RATE_LIMIT_WHITELIST_DOMAINS", [])
        if whitelist_domains:
            origin = request.headers.get("origin", "")
            if origin:
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(origin)
                    origin_domain = parsed.netloc.lower()
                    if ":" in origin_domain:
                        origin_domain = origin_domain.split(":")[0]
                    if origin_domain in whitelist_domains:
                        return True
                except Exception:
                    pass
    
    return False


class RateLimitExceeded(HTTPException):
    """Exception raised when rate limit is exceeded."""

    def __init__(self, retry_after: int, limit: int, window: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Maximum {limit} requests per {window} seconds.",
                "retry_after": retry_after,
            },
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
            },
        )


@dataclass
class RateLimitResult:
    """Result of a rate limit check."""
    allowed: bool
    remaining: int
    reset_at: int
    limit: int


class InMemoryRateLimiter:
    """In-memory rate limiter for development."""

    def __init__(self) -> None:
        self._store: dict[str, list[float]] = {}

    async def check(
        self,
        key: str,
        limit: int,
        window: int,
    ) -> RateLimitResult:
        """Check if request is within rate limit."""
        now = time.time()
        window_start = now - window

        # Get existing timestamps, filter expired ones
        timestamps = self._store.get(key, [])
        timestamps = [ts for ts in timestamps if ts > window_start]

        # Check limit
        if len(timestamps) >= limit:
            oldest = min(timestamps) if timestamps else now
            reset_at = int(oldest + window)
            return RateLimitResult(
                allowed=False,
                remaining=0,
                reset_at=reset_at,
                limit=limit,
            )

        # Add new timestamp
        timestamps.append(now)
        self._store[key] = timestamps

        return RateLimitResult(
            allowed=True,
            remaining=limit - len(timestamps),
            reset_at=int(now + window),
            limit=limit,
        )

    async def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        self._store.pop(key, None)


class RedisRateLimiter:
    """Redis-backed rate limiter for production."""

    def __init__(self, url: str) -> None:
        self._url = url
        self._client: redis.Redis | None = None

    async def _get_client(self) -> redis.Redis:
        """Lazy initialization of Redis client."""
        if self._client is None:
            self._client = redis.from_url(self._url)
        return self._client

    async def check(
        self,
        key: str,
        limit: int,
        window: int,
    ) -> RateLimitResult:
        """Check if request is within rate limit using sliding window."""
        client = await self._get_client()
        now = time.time()
        window_start = now - window

        pipe = client.pipeline()

        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)
        # Count current entries
        pipe.zcard(key)
        # Add new entry
        pipe.zadd(key, {str(now): now})
        # Set expiry
        pipe.expire(key, window)

        results = await pipe.execute()
        current_count = results[1]

        if current_count >= limit:
            # Get oldest timestamp to calculate reset time
            oldest = await client.zrange(key, 0, 0, withscores=True)
            reset_at = int(oldest[0][1] + window) if oldest else int(now + window)

            return RateLimitResult(
                allowed=False,
                remaining=0,
                reset_at=reset_at,
                limit=limit,
            )

        return RateLimitResult(
            allowed=True,
            remaining=limit - current_count - 1,
            reset_at=int(now + window),
            limit=limit,
        )

    async def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        client = await self._get_client()
        await client.delete(key)


def _create_backend() -> InMemoryRateLimiter | RedisRateLimiter:
    """Create appropriate rate limiter backend."""
    redis_url = getattr(settings, "REDIS_URL", None)

    if redis_url and REDIS_AVAILABLE:
        return RedisRateLimiter(redis_url)

    return InMemoryRateLimiter()


# Global backend instance
_backend = _create_backend()


class RateLimiter:
    """
    Rate limiter for API endpoints.
    
    Args:
        requests: Maximum number of requests allowed
        window: Time window in seconds
    
    Usage:
        limiter = RateLimiter(requests=1000, window=3600)
        
        @router.get("/api/v1/items")
        async def list_items(request: Request):
            await limiter.check(get_client_identifier(request), request=request)
            # ... handle request
    """

    def __init__(self, requests: int, window: int) -> None:
        self.requests = requests
        self.window = window

    async def check(
        self,
        identifier: str,
        request: Request | None = None,
    ) -> RateLimitResult:
        """
        Check if request is within rate limit.
        
        Args:
            identifier: Unique identifier (user ID, IP, session, etc.)
            request: Optional Request object for whitelist checking
        
        Raises:
            RateLimitExceeded: If rate limit is exceeded
        
        Returns:
            RateLimitResult with remaining quota info
        """
        # Skip rate limiting for whitelisted sources
        if request is not None and is_whitelisted(request):
            return RateLimitResult(
                allowed=True,
                remaining=self.requests,  # Show full quota
                reset_at=int(time.time()) + self.window,
                limit=self.requests,
            )

        key = f"rate_limit:{identifier}"
        result = await _backend.check(key, self.requests, self.window)

        if not result.allowed:
            retry_after = result.reset_at - int(time.time())
            raise RateLimitExceeded(
                retry_after=max(1, retry_after),
                limit=self.requests,
                window=self.window,
            )

        return result

    async def reset(self, identifier: str) -> None:
        """Reset rate limit for an identifier."""
        key = f"rate_limit:{identifier}"
        await _backend.reset(key)


def get_client_identifier(request: Request) -> str:
    """
    Get unique client identifier from request.
    
    Priority: IP Address (can be extended for user authentication)
    
    Args:
        request: FastAPI request object
    
    Returns:
        Unique identifier string
    """
    # Priority 1: IP Address
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")

    return f"ip:{ip}"

