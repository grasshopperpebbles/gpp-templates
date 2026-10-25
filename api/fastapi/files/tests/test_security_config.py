"""Startup secret guard, CORS credentials and REDIS_URL parsing."""
from __future__ import annotations

import pytest

from app.core.config import Settings, check_secret_for_production
from app.main import app, lifespan

DEFAULT_SECRETS = ["change-me-in-production", "change-me-in-production-use-a-strong-secret-key", ""]
REAL_SECRET = "f3b1c0d4e5a69788c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6"


@pytest.mark.parametrize("secret", DEFAULT_SECRETS)
def test_production_refuses_default_secret(secret):
    s = Settings(_env_file=None, ENVIRONMENT="production", DEBUG=False, JWT_SECRET=secret)
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        check_secret_for_production(s)


def test_environment_defaults_to_production():
    assert Settings(_env_file=None).ENVIRONMENT == "production"


def test_production_accepts_real_secret():
    check_secret_for_production(
        Settings(_env_file=None, ENVIRONMENT="production", JWT_SECRET=REAL_SECRET)
    )


@pytest.mark.parametrize(
    "overrides",
    [{"ENVIRONMENT": "development"}, {"ENVIRONMENT": "test"}, {"DEBUG": True}],
)
def test_dev_allows_default_secret(overrides):
    check_secret_for_production(Settings(_env_file=None, **overrides))


async def test_startup_fails_with_default_secret_in_production(monkeypatch):
    from app.core import config

    monkeypatch.setattr(
        config,
        "settings",
        Settings(_env_file=None, ENVIRONMENT="production", DEBUG=False),
    )
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        async with lifespan(app):
            pass


def preflight(client, origin: str):
    return client.options(
        "/api/v1/auth/me",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )


async def test_cors_does_not_allow_credentials(client):
    # http://localhost:3000 is in CORS_ORIGINS via tests/conftest.py TEST_SETTINGS.
    resp = await preflight(client, "http://localhost:3000")
    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "access-control-allow-credentials" not in resp.headers


async def test_cors_rejects_unlisted_origin(client):
    resp = await preflight(client, "http://evil.example")
    assert resp.status_code == 400
    assert "access-control-allow-origin" not in resp.headers


def test_empty_redis_url_in_env_file_disables_redis(tmp_path, monkeypatch):
    monkeypatch.delenv("REDIS_URL", raising=False)
    env = tmp_path / ".env"
    env.write_text("REDIS_URL=\n")
    assert Settings(_env_file=env).REDIS_URL == ""


async def test_health_reports_disabled_for_env_file_with_empty_redis_url(
    client, tmp_path, monkeypatch
):
    from app.core import redis as redis_module

    monkeypatch.delenv("REDIS_URL", raising=False)
    env = tmp_path / ".env"
    env.write_text("REDIS_URL=\n")
    monkeypatch.setattr(redis_module, "settings", Settings(_env_file=env))
    monkeypatch.setattr(redis_module, "_client", None)
    resp = await client.get("/health")
    assert resp.json() == {"status": "ok", "redis": "disabled"}


def test_env_example_starts_in_development():
    # gpp seeds .env from env.example.txt; local dev must start with it as-is.
    from pathlib import Path

    example = Path(__file__).resolve().parent.parent / "env.example.txt"
    s = Settings(_env_file=example)
    assert s.is_dev
    check_secret_for_production(s)
