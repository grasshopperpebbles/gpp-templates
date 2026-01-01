"""
Rate Limiting Module

Provides rate limiting for API endpoints with support for:
- In-memory (development) and Redis (production) backends
- Per-user, per-IP, and per-tier limits
- AI-specific presets (lower limits for expensive operations)

Install Redis support: pip install ".[cache]"

Usage:
    from app.core.rate_limit import RateLimiter, RateLimitPresets

    # Create a limiter
    limiter = RateLimiter(requests=10, window=60)  # 10 requests per minute

    # Use in route
    @router.post("/generate")
    async def generate(request: Request):
        identifier = get_client_identifier(request)
        await limiter.check(identifier)  # Raises RateLimitExceeded if over limit
        # ... process request

    # Or use preset
    ai_limiter = RateLimitPresets.ai_generation()

    @router.post("/ai/generate")
    async def ai_generate(request: Request, current_user: User = Depends(get_current_user)):
        # Use user ID for authenticated requests
        await ai_limiter.check(f"user:{current_user.id}")
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

if TYPE_CHECKING:
    from app.db.models.user import User

from app.core.config import settings


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
        limiter = RateLimiter(requests=10, window=60)

        @router.post("/api/endpoint")
        async def endpoint(request: Request):
            await limiter.check(get_client_identifier(request))
            # ... handle request
    """

    def __init__(self, requests: int, window: int) -> None:
        self.requests = requests
        self.window = window

    async def check(self, identifier: str) -> RateLimitResult:
        """
        Check if request is within rate limit.

        Args:
            identifier: Unique identifier (user ID, IP, session, etc.)

        Raises:
            RateLimitExceeded: If rate limit is exceeded

        Returns:
            RateLimitResult with remaining quota info
        """
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


def get_client_identifier(request: Request, user: "User | None" = None) -> str:
    """
    Get unique client identifier from request.

    Priority: User ID > Session ID > IP Address

    Args:
        request: FastAPI request object
        user: Optional authenticated user

    Returns:
        Unique identifier string
    """
    # Priority 1: User ID (if authenticated)
    if user:
        return f"user:{user.id}"

    # Priority 2: Custom header (set by middleware/auth)
    user_id = request.headers.get("x-user-id")
    if user_id:
        return f"user:{user_id}"

    # Priority 3: Session ID
    session_id = request.headers.get("x-session-id")
    if session_id:
        return f"session:{session_id}"

    # Priority 4: IP Address
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.headers.get("x-real-ip") or request.client.host if request.client else "unknown"

    return f"ip:{ip}"


class RateLimitPresets:
    """
    Preset rate limiters for common use cases.

    Usage:
        from app.core.rate_limit import RateLimitPresets

        limiter = RateLimitPresets.ai_generation()
    """

    @staticmethod
    def strict() -> RateLimiter:
        """
        5 requests per minute.
        Use for: Login, password reset, sensitive operations.
        """
        return RateLimiter(requests=5, window=60)

    @staticmethod
    def standard() -> RateLimiter:
        """
        30 requests per minute.
        Use for: General API calls, form submissions.
        """
        return RateLimiter(requests=30, window=60)

    @staticmethod
    def relaxed() -> RateLimiter:
        """
        120 requests per minute (2 per second).
        Use for: Read operations, searches, browsing.
        """
        return RateLimiter(requests=120, window=60)

    @staticmethod
    def payment() -> RateLimiter:
        """
        3 requests per minute.
        Use for: Payment processing, financial operations.
        """
        return RateLimiter(requests=3, window=60)

    # ===== AI-SPECIFIC PRESETS =====

    @staticmethod
    def ai_generation() -> RateLimiter:
        """
        10 requests per minute.
        Use for: AI text/image generation (expensive operations).
        """
        return RateLimiter(requests=10, window=60)

    @staticmethod
    def ai_generation_free_tier() -> RateLimiter:
        """
        5 requests per hour.
        Use for: Free tier AI generation limits.
        """
        return RateLimiter(requests=5, window=3600)

    @staticmethod
    def ai_generation_pro_tier() -> RateLimiter:
        """
        100 requests per hour.
        Use for: Pro/paid tier AI generation limits.
        """
        return RateLimiter(requests=100, window=3600)

    @staticmethod
    def ai_batch() -> RateLimiter:
        """
        5 requests per minute.
        Use for: Batch AI operations (multiple generations).
        """
        return RateLimiter(requests=5, window=60)


class TieredRateLimiter:
    """
    Rate limiter that applies different limits based on user tier.

    Usage:
        tiered_limiter = TieredRateLimiter(
            tiers={
                "free": RateLimiter(requests=5, window=3600),
                "pro": RateLimiter(requests=100, window=3600),
                "enterprise": RateLimiter(requests=1000, window=3600),
            },
            default_tier="free",
        )

        @router.post("/ai/generate")
        async def generate(request: Request, current_user: User = Depends(get_current_user)):
            await tiered_limiter.check(
                identifier=f"user:{current_user.id}",
                tier=current_user.tier,
            )
            # ... process request
    """

    def __init__(
        self,
        tiers: dict[str, RateLimiter],
        default_tier: str = "free",
    ) -> None:
        self.tiers = tiers
        self.default_tier = default_tier

    async def check(self, identifier: str, tier: str | None = None) -> RateLimitResult:
        """
        Check rate limit for user's tier.

        Args:
            identifier: Unique identifier (usually user ID)
            tier: User's subscription tier

        Raises:
            RateLimitExceeded: If rate limit is exceeded
        """
        tier_name = tier or self.default_tier
        limiter = self.tiers.get(tier_name, self.tiers[self.default_tier])

        # Include tier in key so limits are per-tier
        tiered_identifier = f"{identifier}:{tier_name}"
        return await limiter.check(tiered_identifier)


# Pre-configured tiered limiter for AI operations
ai_tiered_limiter = TieredRateLimiter(
    tiers={
        "free": RateLimitPresets.ai_generation_free_tier(),
        "pro": RateLimitPresets.ai_generation_pro_tier(),
        "enterprise": RateLimiter(requests=1000, window=3600),
    },
    default_tier="free",
)
