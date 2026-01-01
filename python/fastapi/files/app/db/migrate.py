from alembic import command
from alembic.config import Config

def run_migrations() -> None:
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")