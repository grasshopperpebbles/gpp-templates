# Production image for the FastAPI app. Dev/test deps (requirements-dev.txt)
# are not installed here; run tests in a separate python:3.12 container.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin app
COPY --chown=app:app . .
USER app

EXPOSE 8000

# slim has no curl: probe /health with the standard library.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4)"]

# Migrations are not run automatically. Apply them with:
#   docker compose exec <slug>-api alembic upgrade head
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
