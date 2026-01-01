from __future__ import annotations

import pandas as pd

from trading.strategy import Strategy, Signal

class SimpleMomentum(Strategy):
    name = "simple-momentum"

    def __init__(self, lookback: int = 20, threshold: float = 0.0):
        self.lookback = lookback
        self.threshold = threshold

    def generate_signals(self, df: pd.DataFrame) -> list[Signal]:
        if "close" not in df.columns:
            raise ValueError("Expected 'close' column")

        roll = df["close"].rolling(self.lookback).mean()
        signals: list[Signal] = []
        if len(df) < self.lookback + 2:
            return signals

        prev = df["close"].iloc[-2] - roll.iloc[-2]
        curr = df["close"].iloc[-1] - roll.iloc[-1]

        if prev <= self.threshold and curr > self.threshold:
            signals.append(Signal(timestamp=df.index[-1], side="buy", reason="cross_above_mean"))
        elif prev >= self.threshold and curr < self.threshold:
            signals.append(Signal(timestamp=df.index[-1], side="sell", reason="cross_below_mean"))
        return signals
