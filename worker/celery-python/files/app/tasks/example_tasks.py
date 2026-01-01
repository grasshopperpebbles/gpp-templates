"""
Example Celery tasks.

These demonstrate common task patterns. Replace with your own tasks.
"""
import time
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(bind=True, max_retries=3)
def example_task(self, data: dict) -> dict:
    """
    Example task that processes data.

    Args:
        data: Input data to process

    Returns:
        Processed result
    """
    logger.info(f"Processing task with data: {data}")

    try:
        # Simulate some work
        time.sleep(2)

        result = {
            "status": "completed",
            "input": data,
            "processed": True,
        }

        logger.info(f"Task completed: {result}")
        return result

    except Exception as exc:
        logger.error(f"Task failed: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task
def send_email_task(to: str, subject: str, body: str) -> dict:
    """
    Example email sending task.

    In production, integrate with your email service (Resend, SendGrid, etc.)
    """
    logger.info(f"Sending email to {to}: {subject}")

    # TODO: Integrate with email service
    # from app.services.email import send_email
    # send_email(to=to, subject=subject, body=body)

    return {"sent": True, "to": to, "subject": subject}


@shared_task
def cleanup_task() -> dict:
    """
    Example maintenance task for Celery Beat.

    Schedule this in celery_app.py beat_schedule.
    """
    logger.info("Running cleanup task")

    # TODO: Add cleanup logic
    # - Delete expired sessions
    # - Clean up temporary files
    # - Archive old data

    return {"status": "cleanup_completed"}


@shared_task(bind=True)
def long_running_task(self, total_items: int) -> dict:
    """
    Example long-running task with progress updates.

    Use self.update_state() to track progress.
    """
    for i in range(total_items):
        # Update progress
        self.update_state(
            state="PROGRESS",
            meta={"current": i + 1, "total": total_items}
        )

        # Simulate work
        time.sleep(0.5)

    return {"status": "completed", "processed": total_items}
