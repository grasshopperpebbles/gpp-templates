from __future__ import annotations

from dataclasses import dataclass
import pandas as pd

@dataclass(frozen=True)
class OHLCV:
    df: pd.DataFrame

    def validate(self) -> None:
        required = {"open", "high", "low", "close", "volume"}
        missing = required - set(self.df.columns)
        if missing:
            raise ValueError(f"Missing required OHLCV columns: {sorted(missing)}")
        if not isinstance(self.df.index, pd.DatetimeIndex):
            raise ValueError("OHLCV.df must use a DatetimeIndex")

def load_csv(path: str) -> OHLCV:
    df = pd.read_csv(path, parse_dates=True, index_col=0)
    ohlcv = OHLCV(df=df)
    ohlcv.validate()
    return ohlcv
