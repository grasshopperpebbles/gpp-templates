from __future__ import annotations

from dataclasses import dataclass
import pandas as pd

@dataclass
class Signal:
    timestamp: pd.Timestamp
    side: str  # "buy" or "sell"
    reason: str

class Strategy:
    name: str = "base"

    def generate_signals(self, df: pd.DataFrame) -> list[Signal]:
        raise NotImplementedError
