"""FastAPI application entry point."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import check_secret_for_production, settings
from app.core.logging import setup_logging
from app.core.redis import close_redis, redis_status

# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    check_secret_for_production()
    yield
    await close_redis()


# Create FastAPI app
app = FastAPI(
    lifespan=lifespan,
    title="API",
    description="FastAPI application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    # Auth is Bearer tokens in the Authorization header, not cookies, so no
    # credentialed CORS. Keep it False if CORS_ORIGINS ever includes "null"
    # (a packaged Electron app sends Origin: null): with credentials, any
    # sandboxed page could make credentialed calls. See README "CORS".
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Liveness check. Redis state is reported but never fails the check;
    DB/Redis readiness is handled by docker compose depends_on."""
    return {"status": "ok", "redis": await redis_status()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )

