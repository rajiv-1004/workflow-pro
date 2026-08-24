import pytest


def test_get_and_update_profile(client, normal_user_token_headers):
    # Get profile
    res = client.get("/api/v1/profile/me", headers=normal_user_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "employee@acme.com"
    assert "role_name" in data
    assert "company_name" in data

    # Update profile
    up_res = client.patch(
        "/api/v1/profile/me",
        json={"full_name": "Updated Employee Name"},
        headers=normal_user_token_headers,
    )
    assert up_res.status_code == 200
    assert up_res.json()["full_name"] == "Updated Employee Name"


def test_change_password_and_login(client, normal_user_token_headers):
    # Try with incorrect current password
    err_res = client.patch(
        "/api/v1/profile/change-password",
        json={
            "current_password": "WrongPassword123",
            "new_password": "NewSecretPassword123!",
            "confirm_password": "NewSecretPassword123!",
        },
        headers=normal_user_token_headers,
    )
    assert err_res.status_code == 401

    # Try with mismatched confirmation
    mis_res = client.patch(
        "/api/v1/profile/change-password",
        json={
            "current_password": "Password123",
            "new_password": "NewSecretPassword123!",
            "confirm_password": "DifferentPassword123!",
        },
        headers=normal_user_token_headers,
    )
    assert mis_res.status_code == 422

    # Change password successfully
    chg_res = client.patch(
        "/api/v1/profile/change-password",
        json={
            "current_password": "Password123",
            "new_password": "NewSecretPassword123!",
            "confirm_password": "NewSecretPassword123!",
        },
        headers=normal_user_token_headers,
    )
    assert chg_res.status_code == 200

    # Try login with old password -> should fail
    old_login = client.post(
        "/api/v1/auth/login",
        data={"username": "employee@acme.com", "password": "Password123"},
    )
    assert old_login.status_code == 401

    # Login with new password -> should succeed
    new_login = client.post(
        "/api/v1/auth/login",
        data={"username": "employee@acme.com", "password": "NewSecretPassword123!"},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()
