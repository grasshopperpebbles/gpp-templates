from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select, update

from app.core.security import create_access_token, verify_password
from app.db.models import User

EMAIL = "alice@example.com"
PASSWORD = "correct horse battery staple"


async def register(client, email: str = EMAIL, password: str = PASSWORD):
    return await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "name": "Alice"},
    )


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_register_creates_user_and_returns_tokens(client, db):
    resp = await register(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"] and body["refresh_token"]
    assert body["user"]["email"] == EMAIL
    assert body["user"]["name"] == "Alice"

    async with db() as session:
        user = (await session.execute(select(User).where(User.email == EMAIL))).scalar_one()
    assert user.hashed_password != PASSWORD
    assert verify_password(PASSWORD, user.hashed_password)


async def test_register_rejects_duplicate_email(client, db):
    assert (await register(client)).status_code == 201
    resp = await register(client)
    assert resp.status_code == 409


async def test_register_rejects_invalid_email(client, db):
    resp = await register(client, email="not-an-email")
    assert resp.status_code == 422


async def test_login_returns_token_that_works_on_me(client, db):
    await register(client)
    resp = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    me = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert me.status_code == 200
    assert me.json()["email"] == EMAIL

    users_me = await client.get("/api/v1/users/me", headers=bearer(token))
    assert users_me.status_code == 200
    assert users_me.json()["email"] == EMAIL


async def test_login_rejects_wrong_password(client, db):
    await register(client)
    resp = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": "nope"})
    assert resp.status_code == 401


async def test_login_rejects_unknown_user(client, db):
    resp = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert resp.status_code == 401


async def test_login_rejects_disabled_account(client, db):
    await register(client)
    async with db() as session:
        await session.execute(update(User).where(User.email == EMAIL).values(is_active=False))
        await session.commit()
    resp = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert resp.status_code == 403


async def test_refresh_issues_new_access_token(client, db):
    refresh_token = (await register(client)).json()["refresh_token"]
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    me = await client.get("/api/v1/auth/me", headers=bearer(resp.json()["access_token"]))
    assert me.status_code == 200


async def test_refresh_rejects_access_token(client, db):
    access_token = (await register(client)).json()["access_token"]
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": access_token})
    assert resp.status_code == 401


async def test_me_requires_token(client, db):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)


async def test_me_rejects_expired_token(client, db):
    user_id = (await register(client)).json()["user"]["id"]
    expired = create_access_token({"sub": user_id}, expires_delta=timedelta(minutes=-1))
    resp = await client.get("/api/v1/auth/me", headers=bearer(expired))
    assert resp.status_code == 401


async def test_update_me_changes_name_and_password(client, db):
    token = (await register(client)).json()["access_token"]
    resp = await client.patch(
        "/api/v1/users/me",
        headers=bearer(token),
        json={"name": "Alice B", "password": "new password"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Alice B"
    login = await client.post(
        "/api/v1/auth/login", json={"email": EMAIL, "password": "new password"}
    )
    assert login.status_code == 200
