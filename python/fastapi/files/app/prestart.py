from __future__ import annotations

import time
import sys

from sqlalchemy import text

from app.db.session import SessionLocal
from app.db.migrate import run_migrations
from app.db.seed_admin import seed_admin


def wait_for_db(max_seconds: int = 60) -> None:
    start = time.time()
    while True:
        try:
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            db.close()
            return
        except Exception:
            if time.time() - start > max_seconds:
                print("[prestart] DB not ready after timeout", file=sys.stderr)
                raise
            time.sleep(2)


def main() -> None:
    wait_for_db()
    run_migrations()
    seed_admin()


if __name__ == "__main__":
    main()
