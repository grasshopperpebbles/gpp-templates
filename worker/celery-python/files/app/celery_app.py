"""
Celery application configuration.

This module creates and configures the Celery app instance.
Import this in your FastAPI app to dispatch tasks.
"""
from celery import Celery
from .core.config import settings

# Create Celery app
celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Task execution settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour

    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=settings.CELERY_WORKER_CONCURRENCY,

    # Beat scheduler (for periodic tasks)
    beat_scheduler="celery.beat:PersistentScheduler",
    beat_schedule_filename=".celerybeat-schedule",
)

# Auto-discover tasks from the tasks module
celery_app.autodiscover_tasks(["app.tasks"])


# Optional: Define periodic tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    # Example: Run every 5 minutes
    # "cleanup-expired-sessions": {
    #     "task": "app.tasks.maintenance.cleanup_sessions",
    #     "schedule": 300.0,  # 5 minutes
    # },
}
