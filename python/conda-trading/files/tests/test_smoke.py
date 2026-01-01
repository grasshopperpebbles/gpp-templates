from trading.strategies.momentum import SimpleMomentum
import pandas as pd

def test_strategy_runs_on_minimal_df():
    idx = pd.date_range("2025-01-01", periods=30, freq="D")
    df = pd.DataFrame({"close": range(30)}, index=idx)
    s = SimpleMomentum(lookback=5)
    out = s.generate_signals(df)
    assert isinstance(out, list)
