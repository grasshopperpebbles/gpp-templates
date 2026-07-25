import os

import resend

resend.api_key = os.environ.get("RESEND_API_KEY", "")


def send_transactional_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
) -> None:
    from_email = os.environ.get("EMAIL_FROM", "noreply@example.com")
    params: dict = {
        "from": from_email,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        params["text"] = text
    resend.Emails.send(params)
