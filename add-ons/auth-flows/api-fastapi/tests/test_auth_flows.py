"""Auth flows (gpp add auth-flows): verification and password reset, end to end
against the in-memory SQLite database from conftest."""
from __future__ import annotations

from urllib.parse import parse_qs, urlparse

import pytest

from app.core import email as email_module

PASSWORD = "correct-horse-1"


@pytest.fixture
def outbox(monkeypatch: pytest.MonkeyPatch) -> list[email_module.Email]:
    """Capture emails instead of sending them."""
    sent: list[email_module.Email] = []

    async def fake_deliver(message: email_module.Email) -> bool:
        sent.append(message)
        return True

    monkeypatch.setattr(email_module, "deliver", fake_deliver)
    return sent


def token_from(message: email_module.Email) -> str:
    for word in message.text.split():
        if "token=" in word:
            return parse_qs(urlparse(word).query)["token"][0]
    raise AssertionError(f"no link in email: {message.text}")


async def register(client, email: str = "ada@example.com") -> dict:
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "name": "Ada"},
    )
    assert response.status_code == 201, response.text
    return response.json()


async def login(client, email: str, password: str) -> int:
    response = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    return response.status_code


async def test_register_sends_a_verification_link_that_works_once(client, db, outbox):
    tokens = await register(client)
    assert len(outbox) == 1
    assert outbox[0].to == "ada@example.com"
    token = token_from(outbox[0])
    auth = {"Authorization": f"Bearer {tokens['access_token']}"}

    status = await client.get("/api/v1/auth/verification-status", headers=auth)
    assert status.json()["email_verified"] is False

    verified = await client.post("/api/v1/auth/verify-email", json={"token": token})
    assert verified.status_code == 200, verified.text

    status = await client.get("/api/v1/auth/verification-status", headers=auth)
    assert status.json()["email_verified"] is True
    assert status.json()["email_verified_at"]

    again = await client.post("/api/v1/auth/verify-email", json={"token": token})
    assert again.status_code == 400


async def test_tampered_and_malformed_tokens_are_rejected(client, db, outbox):
    await register(client)
    token_id, _, secret = token_from(outbox[0]).partition(".")
    for bad in (f"{token_id}.{secret[:-1]}x", token_id, "not-a-token", f"{token_id}."):
        response = await client.post("/api/v1/auth/verify-email", json={"token": bad})
        assert response.status_code == 400, bad


async def test_resend_replaces_the_previous_link(client, db, outbox):
    await register(client)
    first = token_from(outbox[0])
    response = await client.post(
        "/api/v1/auth/resend-verification", json={"email": "ada@example.com"}
    )
    assert response.status_code == 200
    second = token_from(outbox[1])

    assert (await client.post("/api/v1/auth/verify-email", json={"token": first})).status_code == 400
    assert (await client.post("/api/v1/auth/verify-email", json={"token": second})).status_code == 200


async def test_forgot_password_answers_the_same_for_unknown_emails(client, db, outbox):
    await register(client)
    outbox.clear()
    known = await client.post("/api/v1/auth/forgot-password", json={"email": "ada@example.com"})
    unknown = await client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json()
    assert [message.to for message in outbox] == ["ada@example.com"]


async def test_password_reset_changes_the_password_once(client, db, outbox):
    await register(client)
    outbox.clear()
    await client.post("/api/v1/auth/forgot-password", json={"email": "ada@example.com"})
    stale = token_from(outbox[0])
    await client.post("/api/v1/auth/forgot-password", json={"email": "ada@example.com"})
    token = token_from(outbox[1])

    # A newer link makes the older one useless
    response = await client.post(
        "/api/v1/auth/reset-password", json={"token": stale, "password": "new-password-2"}
    )
    assert response.status_code == 400

    response = await client.post(
        "/api/v1/auth/reset-password", json={"token": token, "password": "new-password-2"}
    )
    assert response.status_code == 200, response.text
    assert await login(client, "ada@example.com", PASSWORD) == 401
    assert await login(client, "ada@example.com", "new-password-2") == 200

    reused = await client.post(
        "/api/v1/auth/reset-password", json={"token": token, "password": "another-pass-3"}
    )
    assert reused.status_code == 400
    assert await login(client, "ada@example.com", "new-password-2") == 200


async def test_verification_token_cannot_reset_a_password(client, db, outbox):
    await register(client)
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token_from(outbox[0]), "password": "new-password-2"},
    )
    assert response.status_code == 400
