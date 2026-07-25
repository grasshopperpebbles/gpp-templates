import os

from posthog import Posthog

posthog_client = Posthog(
    os.environ.get("POSTHOG_API_KEY", ""),
    host=os.environ.get("POSTHOG_HOST", "https://us.i.posthog.com"),
)
