from __future__ import annotations

import pytest

from app.core import redis as redis_module
from app.core.config import Settings, settings


async def test_health_ok_with_redis(client, fake_redis):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "redis": "ok"}


async def test_health_stays_200_when_redis_is_down(client, fake_redis):
    fake_redis.healthy = False
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "redis": "unavailable"}


async def test_health_reports_disabled_without_redis_url(client, monkeypatch):
    monkeypatch.setattr(settings, "REDIS_URL", "")
    monkeypatch.setattr(redis_module, "_client", None)
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "redis": "disabled"}


async def test_unreachable_redis_reports_unavailable(monkeypatch):
    # Real client against a port nothing listens on: fails fast, no exception.
    monkeypatch.setattr(settings, "REDIS_URL", "redis://127.0.0.1:1/0")
    monkeypatch.setattr(redis_module, "_client", None)
    assert await redis_module.redis_status() == "unavailable"
    await redis_module.close_redis()


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("http://a.test,http://b.test", ["http://a.test", "http://b.test"]),
        (" http://a.test , ", ["http://a.test"]),
    ],
)
def test_cors_origins_parsed_from_comma_separated_env(monkeypatch, raw, expected):
    monkeypatch.setenv("CORS_ORIGINS", raw)
    assert Settings(_env_file=None).cors_origins == expected
