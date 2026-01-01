# Celery Worker

Background task processing with Celery and Redis.

## Quick Start

```bash
# Start services
docker compose up -d

# View worker logs
docker compose logs -f worker

# Stop services
docker compose down
```

## Architecture

```
worker/
├── app/
│   ├── celery_app.py      # Celery configuration
│   ├── core/
│   │   └── config.py      # Settings (pydantic-settings)
│   └── tasks/
│       ├── __init__.py    # Task exports
│       └── example_tasks.py  # Example tasks
├── docker-compose.yml     # Redis + Worker + Beat
├── Dockerfile
└── pyproject.toml
```

## Creating Tasks

Add new task files in `app/tasks/`:

```python
# app/tasks/my_tasks.py
from celery import shared_task

@shared_task
def my_task(data: dict) -> dict:
    # Process data
    return {"status": "done"}
```

Export in `app/tasks/__init__.py`:

```python
from .my_tasks import *
```

## Calling Tasks

### From FastAPI

```python
from app.celery_app import celery_app

# Import the task
from app.tasks.example_tasks import example_task

# Call asynchronously
result = example_task.delay({"key": "value"})

# Or with apply_async for more control
result = example_task.apply_async(
    args=[{"key": "value"}],
    countdown=10,  # Delay 10 seconds
    expires=3600,  # Expire after 1 hour
)

# Check result
if result.ready():
    print(result.get())
```

### Check Task Status

```python
from celery.result import AsyncResult

result = AsyncResult(task_id)
print(result.state)  # PENDING, STARTED, SUCCESS, FAILURE
print(result.info)   # Task result or error
```

## Periodic Tasks (Celery Beat)

Uncomment the `beat` service in `docker-compose.yml`, then add schedules in `celery_app.py`:

```python
celery_app.conf.beat_schedule = {
    "cleanup-every-hour": {
        "task": "app.tasks.maintenance.cleanup_task",
        "schedule": 3600.0,  # Every hour
    },
    "report-daily": {
        "task": "app.tasks.reports.daily_report",
        "schedule": crontab(hour=9, minute=0),  # 9 AM daily
    },
}
```

## Monitoring with Flower

Uncomment the `flower` service in `docker-compose.yml`:

```bash
docker compose up -d flower
```

Access at: http://localhost:5555

## Integration with FastAPI

Share the Celery app between worker and API:

1. Create a shared package in `packages/py_shared/`
2. Import `celery_app` in both FastAPI and worker
3. Call tasks from FastAPI endpoints

See `docs/FASTAPI_INTEGRATION.md` for details.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| REDIS_HOST | localhost | Redis server host |
| REDIS_PORT | 6379 | Redis server port |
| REDIS_DB | 0 | Redis database number |
| REDIS_PASSWORD | | Redis password (if required) |
| CELERY_WORKER_CONCURRENCY | 4 | Number of worker processes |

## Testing

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest
```
