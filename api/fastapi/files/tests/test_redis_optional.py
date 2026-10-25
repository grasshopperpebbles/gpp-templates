"""The app must run without the `redis` package (gpp drops it from
requirements.txt when a recipe opts out of Redis)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

from app.core import redis as redis_module
from app.core.config import settings

PROJECT_ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def redis_package_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    """Make `import redis` / `import redis.asyncio` raise ImportError."""
    for name in list(sys.modules):
        if name == "redis" or name.startswith("redis."):
            monkeypatch.delitem(sys.modules, name)
    monkeypatch.setitem(sys.modules, "redis", None)
    monkeypatch.setitem(sys.modules, "redis.asyncio", None)
    monkeypatch.setattr(redis_module, "_client", None)


async def test_health_reports_disabled_when_package_missing(client, redis_package_missing):
    # REDIS_URL is set (TEST_SETTINGS), but there is no client library.
    assert settings.REDIS_URL
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "redis": "disabled"}


async def test_get_redis_is_none_and_close_is_noop_when_package_missing(redis_package_missing):
    assert redis_module.get_redis() is None
    await redis_module.close_redis()


def test_app_imports_without_redis_package():
    # Fresh interpreter: block the package before anything is imported.
    code = (
        "import sys; sys.modules['redis'] = None; sys.modules['redis.asyncio'] = None\n"
        "import app.main\n"
        "assert 'redis' not in [m for m in sys.modules if sys.modules[m] is not None]\n"
    )
    result = subprocess.run(
        [sys.executable, "-W", "error", "-c", code],
        cwd=PROJECT_ROOT,
        env={"ENVIRONMENT": "test", "PATH": "/usr/bin:/bin"},
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr


def test_module_does_not_import_redis_at_load():
    code = (
        "import sys\n"
        "import app.core.redis\n"
        "assert 'redis' not in sys.modules, sorted(m for m in sys.modules if m.startswith('redis'))\n"
    )
    result = subprocess.run(
        [sys.executable, "-W", "error", "-c", code],
        cwd=PROJECT_ROOT,
        env={"ENVIRONMENT": "test", "PATH": "/usr/bin:/bin"},
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
