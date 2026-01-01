# GPP Python Conda Trading Template

This template is designed for **research / trading / workers** (no FastAPI). It uses **Conda** for the runtime environment and keeps `pyproject.toml` minimal to avoid conflicts.

## Quick start

```bash
# 1) Create the environment
conda env create -f environment.yml

# 2) Activate it
conda activate gpp-trading

# 3) Install this project in editable mode (optional but recommended)
pip install -e .

# 4) Run a sanity check
python -m trading.cli --help
python -m trading.cli run --dry-run
```

## Structure

- `src/trading/` — trading/research code (strategies, data, backtesting scaffolding)
- `notebooks/` — notebooks (kept lightweight; commit notebooks only if you want)
- `scripts/` — one-off scripts and utilities
- `tests/` — unit tests (pytest)

## Notes

- Conda owns the dependency stack (NumPy/Pandas/scientific libs).
- `pyproject.toml` exists mainly for packaging + tooling configs (pytest/ruff).
- If you later add an API: layer a FastAPI platform/template alongside this one (recommended), or add FastAPI dependencies separately.
