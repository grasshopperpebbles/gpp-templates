"""Email delivery for auth flows (gpp add auth-flows).

Providers: console (logs the email, the default in development), resend,
sendgrid (both over HTTPS, no SDK needed) and ses (needs boto3).
"""
from __future__ import annotations

import asyncio
import html
import json
import logging
import urllib.request
from dataclasses import dataclass

from app.core import config
from app.core.auth_flows import auth_flows_settings

logger = logging.getLogger("app.auth_flows.email")

# The provider picked when the add-on was installed; used outside development
# when EMAIL_PROVIDER is not set.
INSTALLED_PROVIDER = "{{EMAIL_PROVIDER}}"
PROVIDERS = ("console", "resend", "sendgrid", "ses")
HTTP_TIMEOUT_SECONDS = 10


@dataclass
class Email:
    to: str
    subject: str
    html: str
    text: str


def email_provider() -> str:
    """EMAIL_PROVIDER if set. Otherwise "console" in development, else the
    installed provider. The test environment (ENVIRONMENT=test) always uses
    "console", so test runs never send real email."""
    settings = config.settings
    if settings.ENVIRONMENT.strip().lower() == "test":
        return "console"
    configured = auth_flows_settings.EMAIL_PROVIDER.strip().lower()
    if configured:
        return configured
    return "console" if settings.is_dev else INSTALLED_PROVIDER


def _post_json(url: str, headers: dict[str, str], payload: dict) -> None:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:
        response.read()


def _send_resend(email: Email) -> None:
    if not auth_flows_settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not set")
    _post_json(
        "https://api.resend.com/emails",
        {"Authorization": f"Bearer {auth_flows_settings.RESEND_API_KEY}"},
        {
            "from": auth_flows_settings.EMAIL_FROM,
            "to": [email.to],
            "subject": email.subject,
            "html": email.html,
            "text": email.text,
        },
    )


def _send_sendgrid(email: Email) -> None:
    if not auth_flows_settings.SENDGRID_API_KEY:
        raise RuntimeError("SENDGRID_API_KEY is not set")
    _post_json(
        "https://api.sendgrid.com/v3/mail/send",
        {"Authorization": f"Bearer {auth_flows_settings.SENDGRID_API_KEY}"},
        {
            "personalizations": [{"to": [{"email": email.to}]}],
            "from": {"email": auth_flows_settings.EMAIL_FROM},
            "subject": email.subject,
            "content": [
                {"type": "text/plain", "value": email.text},
                {"type": "text/html", "value": email.html},
            ],
        },
    )


def _send_ses(email: Email) -> None:
    # boto3 reads AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (or an IAM role)
    import boto3  # requirements.txt gets boto3 when the add-on is installed with ses

    client = boto3.client("ses", region_name=auth_flows_settings.AWS_REGION)
    client.send_email(
        Source=auth_flows_settings.EMAIL_FROM,
        Destination={"ToAddresses": [email.to]},
        Message={
            "Subject": {"Charset": "UTF-8", "Data": email.subject},
            "Body": {
                "Html": {"Charset": "UTF-8", "Data": email.html},
                "Text": {"Charset": "UTF-8", "Data": email.text},
            },
        },
    )


def _send_console(email: Email) -> None:
    if not config.settings.is_dev:
        # Never write sign-in links to production logs.
        logger.error(
            "EMAIL_PROVIDER=console outside development: email %r to %s was not sent",
            email.subject,
            email.to,
        )
        return
    logger.info(
        "[auth-flows] console email (set EMAIL_PROVIDER to send real email)\n"
        "To: %s\nSubject: %s\n\n%s",
        email.to,
        email.subject,
        email.text,
    )


SENDERS = {
    "console": _send_console,
    "resend": _send_resend,
    "sendgrid": _send_sendgrid,
    "ses": _send_ses,
}


async def deliver(email: Email) -> bool:
    """Send one email. Failures are logged, never raised (callers answer the
    same way whether or not the email went out)."""
    provider = email_provider()
    sender = SENDERS.get(provider)
    if sender is None:
        logger.error("Unknown EMAIL_PROVIDER %r (use one of %s)", provider, ", ".join(PROVIDERS))
        return False
    try:
        await asyncio.to_thread(sender, email)
        return True
    except Exception:  # noqa: BLE001 - any provider error
        logger.exception("Sending %r via %s failed", email.subject, provider)
        return False


def _layout(title: str, greeting: str, intro: str, button: str, url: str, outro: str) -> str:
    safe_url = html.escape(url, quote=True)
    return f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size: 22px;">{html.escape(title)}</h1>
  <p>{html.escape(greeting)}</p>
  <p>{html.escape(intro)}</p>
  <p style="margin: 28px 0;">
    <a href="{safe_url}" style="background: #111827; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">{html.escape(button)}</a>
  </p>
  <p style="color: #666; font-size: 14px;">Or open this link: <a href="{safe_url}">{safe_url}</a></p>
  <p style="color: #999; font-size: 12px;">{html.escape(outro)}</p>
</body>
</html>"""


def _greeting(name: str | None) -> str:
    return f"Hi {name}," if name else "Hi,"


async def send_verification_email(to: str, name: str | None, token: str) -> bool:
    url = f"{auth_flows_settings.APP_URL.rstrip('/')}/verify-email?token={token}"
    hours = auth_flows_settings.EMAIL_VERIFICATION_EXPIRE_HOURS
    intro = "Please confirm your email address."
    outro = f"The link expires in {hours} hours. If you didn't create an account, ignore this email."
    return await deliver(
        Email(
            to=to,
            subject="Verify your email address",
            html=_layout("Verify your email", _greeting(name), intro, "Verify email", url, outro),
            text=f"{_greeting(name)}\n\n{intro}\n\n{url}\n\n{outro}\n",
        )
    )


async def send_password_reset_email(to: str, name: str | None, token: str) -> bool:
    url = f"{auth_flows_settings.APP_URL.rstrip('/')}/reset-password?token={token}"
    minutes = auth_flows_settings.PASSWORD_RESET_EXPIRE_MINUTES
    intro = "We received a request to reset your password."
    outro = (
        f"The link expires in {minutes} minutes and works once. "
        "If you didn't ask for this, ignore this email; your password stays the same."
    )
    return await deliver(
        Email(
            to=to,
            subject="Reset your password",
            html=_layout("Reset your password", _greeting(name), intro, "Reset password", url, outro),
            text=f"{_greeting(name)}\n\n{intro}\n\n{url}\n\n{outro}\n",
        )
    )
