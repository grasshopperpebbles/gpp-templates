from __future__ import annotations

from datetime import timedelta

import jwt
import pytest
from sqlalchemy import select, update

from app.api.v1.endpoints import auth as auth_endpoints
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
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


async def test_me_rejects_refresh_token(client, db):
    refresh_token = (await register(client)).json()["refresh_token"]
    resp = await client.get("/api/v1/auth/me", headers=bearer(refresh_token))
    assert resp.status_code == 401
    resp = await client.get("/api/v1/users/me", headers=bearer(refresh_token))
    assert resp.status_code == 401


async def test_me_rejects_token_without_type(client, db):
    user_id = (await register(client)).json()["user"]["id"]
    token = jwt.encode({"sub": user_id}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    resp = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert resp.status_code == 401


def signed(claims: dict) -> str:
    return jwt.encode(claims, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def test_me_rejects_token_without_exp(client, db):
    user_id = (await register(client)).json()["user"]["id"]
    token = signed({"sub": user_id, "type": "access"})
    resp = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert resp.status_code == 401


async def test_me_rejects_token_without_sub(client, db):
    await register(client)
    token = signed({"type": "access", "exp": 4102444800})
    resp = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert resp.status_code == 401


async def test_refresh_rejects_token_without_exp(client, db):
    user_id = (await register(client)).json()["user"]["id"]
    token = signed({"sub": user_id, "type": "refresh"})
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": token})
    assert resp.status_code == 401


async def test_refresh_rejects_token_without_sub(client, db):
    await register(client)
    token = signed({"type": "refresh", "exp": 4102444800})
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": token})
    assert resp.status_code == 401


async def disable(db, email: str = EMAIL) -> None:
    async with db() as session:
        await session.execute(update(User).where(User.email == email).values(is_active=False))
        await session.commit()


async def test_me_rejects_disabled_account(client, db):
    token = (await register(client)).json()["access_token"]
    await disable(db)
    resp = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert resp.status_code == 403


async def test_refresh_rejects_disabled_account(client, db):
    refresh_token = (await register(client)).json()["refresh_token"]
    await disable(db)
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 403


async def test_login_unknown_email_still_runs_bcrypt(client, db, monkeypatch):
    calls: list[str] = []
    real = auth_endpoints.verify_password

    def spy(plain: str, hashed: str) -> bool:
        calls.append(hashed)
        return real(plain, hashed)

    monkeypatch.setattr(auth_endpoints, "verify_password", spy)
    resp = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert resp.status_code == 401
    assert len(calls) == 1 and calls[0].startswith("$2")


@pytest.mark.parametrize(
    "password",
    ["", "short", "x" * 73, "é" * 37],  # last one: 37 chars but 74 bytes
)
async def test_register_rejects_bad_password_length(client, db, password):
    resp = await register(client, password=password)
    assert resp.status_code == 422


async def test_register_accepts_72_byte_password(client, db):
    resp = await register(client, password="x" * 72)
    assert resp.status_code == 201


@pytest.mark.parametrize("password", ["", "short", "x" * 73])
async def test_update_me_rejects_bad_password_length(client, db, password):
    token = (await register(client)).json()["access_token"]
    resp = await client.patch("/api/v1/users/me", headers=bearer(token), json={"password": password})
    assert resp.status_code == 422


# Hashes of PASSWORD written by passlib 1.7.4 (the pack's previous hasher), so
# accounts created before the switch to the bcrypt library still log in.
PASSLIB_HASHES = [
    "$2b$12$NyQhcaVjtT5wWQXOjSuarOy6NEeRGBRnZ5wdKHomuz9/P65xEdXUK",
    "$2a$12$5zkcJN/GUOS35pFToD2GbOozZS2tXkqR9XP/m2bCba6e77E8Ccoae",
    "$2y$12$bcEFgkgEm.9eMumHlC9pmuKDISYBHQq3EPNOS0J04d8ByPIUDyl.i",
]


@pytest.mark.parametrize("hashed", PASSLIB_HASHES)
def test_existing_passlib_hashes_still_verify(hashed):
    assert verify_password(PASSWORD, hashed)
    assert not verify_password("wrong password", hashed)


def test_new_hashes_are_bcrypt_2b():
    hashed = get_password_hash(PASSWORD)
    assert hashed.startswith("$2b$12$")
    assert verify_password(PASSWORD, hashed)


@pytest.mark.parametrize("hashed", ["", "not-a-hash", "$2b$12$short"])
def test_verify_password_rejects_malformed_hash(hashed):
    assert verify_password(PASSWORD, hashed) is False


async def test_login_with_over_72_byte_password_is_401(client, db):
    await register(client)
    resp = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": "x" * 100})
    assert resp.status_code == 401


async def test_passlib_era_account_can_log_in(client, db):
    async with db() as session:
        session.add(User(email=EMAIL, name="Old", hashed_password=PASSLIB_HASHES[0]))
        await session.commit()
    resp = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert resp.status_code == 200
