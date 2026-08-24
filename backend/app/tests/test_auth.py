"""
Covers every scenario listed under Day 7 of the project plan:
registration, duplicate email, wrong password, expired/invalid token,
protected endpoint access, and validation errors.
"""
from datetime import timedelta

from app.core.security import create_access_token


def test_register_success(client, registered_user_payload):
    response = client.post("/api/v1/auth/register", json=registered_user_payload)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == registered_user_payload["email"]
    assert "id" in body
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_duplicate_email_is_rejected(client, registered_user_payload):
    first = client.post("/api/v1/auth/register", json=registered_user_payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=registered_user_payload)
    assert second.status_code == 409
    assert second.json()["error"]["type"] == "DuplicateEmailError"


def test_register_validation_error_on_short_password(client, registered_user_payload):
    registered_user_payload["password"] = "short"
    response = client.post("/api/v1/auth/register", json=registered_user_payload)
    assert response.status_code == 422


def test_login_success(client, registered_user_payload):
    client.post("/api/v1/auth/register", json=registered_user_payload)

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user_payload["email"],
            "password": registered_user_payload["password"],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password_is_rejected(client, registered_user_payload):
    client.post("/api/v1/auth/register", json=registered_user_payload)

    response = client.post(
        "/api/v1/auth/login",
        data={"username": registered_user_payload["email"], "password": "totally-wrong"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["type"] == "InvalidCredentialsError"


def test_login_nonexistent_user_is_rejected(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nobody@example.com", "password": "whatever123"},
    )
    assert response.status_code == 401


def test_protected_endpoint_without_token_is_rejected(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_protected_endpoint_with_valid_token_succeeds(client, registered_user_payload):
    client.post("/api/v1/auth/register", json=registered_user_payload)
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user_payload["email"],
            "password": registered_user_payload["password"],
        },
    )
    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == registered_user_payload["email"]


def test_protected_endpoint_with_expired_token_is_rejected(client, registered_user_payload):
    register_response = client.post("/api/v1/auth/register", json=registered_user_payload)
    user_id = register_response.json()["id"]

    expired_token = create_access_token(subject=user_id, expires_delta=timedelta(seconds=-1))

    response = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401


def test_protected_endpoint_with_garbage_token_is_rejected(client):
    response = client.get(
        "/api/v1/users/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
