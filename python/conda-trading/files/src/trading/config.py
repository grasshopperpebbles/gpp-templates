from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os

@dataclass(frozen=True)
class Settings:
    """Minimal settings model (env-first)."""
    data_dir: Path = Path(os.getenv("TRADING_DATA_DIR", "data"))
    timezone: str = os.getenv("TRADING_TIMEZONE", "America/New_York")
    log_level: str = os.getenv("TRADING_LOG_LEVEL", "INFO")

settings = Settings()
