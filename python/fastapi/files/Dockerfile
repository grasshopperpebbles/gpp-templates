FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Python deps (PINNED)
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    sqlalchemy \
    alembic \
    mako \
    "psycopg[binary]" \
    python-jose \
    "passlib[bcrypt]" \
    bcrypt==4.0.1 \
    pydantic-settings \
    email-validator

COPY . .

CMD ["sh", "-lc", "python -m app.prestart && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
