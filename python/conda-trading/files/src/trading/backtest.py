from __future__ import annotations

from dataclasses import dataclass
import pandas as pd

from trading.strategy import Strategy, Signal

@dataclass
class BacktestResult:
    signals: list[Signal]
    notes: str = ""

def run_backtest(df: pd.DataFrame, strategy: Strategy) -> BacktestResult:
    signals = strategy.generate_signals(df)
    return BacktestResult(signals=signals, notes=f"Generated {len(signals)} signals using {strategy.name}")
