from __future__ import annotations

import argparse
from pathlib import Path

from trading.logging_utils import setup_logging, get_logger
from trading.data import load_csv
from trading.backtest import run_backtest
from trading.strategies.momentum import SimpleMomentum

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="trading", description="GPP trading template CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    run = sub.add_parser("run", help="Run a simple backtest (stub)")
    run.add_argument("--csv", type=str, default="", help="Path to OHLCV CSV (DatetimeIndex in first column)")
    run.add_argument("--lookback", type=int, default=20)
    run.add_argument("--dry-run", action="store_true", help="Run without reading data")

    return p

def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    setup_logging()
    log = get_logger("trading.cli")

    if args.cmd == "run":
        if args.dry_run:
            log.info("Dry run OK. (No data loaded.)")
            return 0

        if not args.csv:
            log.error("Provide --csv path to an OHLCV CSV file.")
            return 2

        path = Path(args.csv)
        if not path.exists():
            log.error("CSV not found: %s", path)
            return 2

        ohlcv = load_csv(str(path))
        strat = SimpleMomentum(lookback=args.lookback)
        res = run_backtest(ohlcv.df, strat)
        log.info(res.notes)
        for s in res.signals:
            log.info("Signal: %s %s (%s)", s.timestamp, s.side, s.reason)
        return 0

    return 1

if __name__ == "__main__":
    raise SystemExit(main())
