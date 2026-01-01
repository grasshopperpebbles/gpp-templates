"""Email sending utilities for Auth Flows."""
import os
from typing import Optional

# Email provider: resend | sendgrid | ses
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "{{EMAIL_PROVIDER}}")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@example.com")
APP_URL = os.getenv("APP_URL", os.getenv("FRONTEND_URL", "http://localhost:3000"))


async def send_email(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Send an email using the configured provider."""
    try:
        if EMAIL_PROVIDER == "resend":
            return await _send_with_resend(to, subject, html, text)
        elif EMAIL_PROVIDER == "sendgrid":
            return await _send_with_sendgrid(to, subject, html, text)
        elif EMAIL_PROVIDER == "ses":
            return await _send_with_ses(to, subject, html, text)
        else:
            print(f"Unknown email provider: {EMAIL_PROVIDER}")
            return False
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


async def _send_with_resend(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Send email using Resend."""
    import resend

    resend.api_key = os.getenv("RESEND_API_KEY")

    params = {
        "from": EMAIL_FROM,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        params["text"] = text

    resend.Emails.send(params)
    return True


async def _send_with_sendgrid(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Send email using SendGrid."""
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    message = Mail(
        from_email=EMAIL_FROM,
        to_emails=to,
        subject=subject,
        html_content=html,
    )
    if text:
        message.plain_text_content = text

    sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
    sg.send(message)
    return True


async def _send_with_ses(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Send email using AWS SES."""
    import boto3

    client = boto3.client(
        "ses",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )

    body = {"Html": {"Charset": "UTF-8", "Data": html}}
    if text:
        body["Text"] = {"Charset": "UTF-8", "Data": text}

    client.send_email(
        Source=EMAIL_FROM,
        Destination={"ToAddresses": [to]},
        Message={
            "Subject": {"Charset": "UTF-8", "Data": subject},
            "Body": body,
        },
    )
    return True


async def send_verification_email(to: str, name: str, token: str) -> bool:
    """Send email verification email."""
    verification_url = f"{APP_URL}/verify-email?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Hi {name},</p>
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all;">{verification_url}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
    </body>
    </html>
    """

    text = f"""
    Hi {name},

    Thanks for signing up! Please verify your email address by clicking the link below:

    {verification_url}

    This link will expire in 24 hours.

    If you didn't create an account, you can safely ignore this email.
    """

    return await send_email(to, "Verify Your Email", html, text)


async def send_password_reset_email(to: str, name: str, token: str) -> bool:
    """Send password reset email."""
    reset_url = f"{APP_URL}/reset-password?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Hi {name},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background: #f5576c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #f5576c; font-size: 14px; word-break: break-all;">{reset_url}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
    </body>
    </html>
    """

    text = f"""
    Hi {name},

    We received a request to reset your password. Click the link below to set a new password:

    {reset_url}

    This link will expire in 1 hour.

    If you didn't request a password reset, you can safely ignore this email.
    """

    return await send_email(to, "Reset Your Password", html, text)
