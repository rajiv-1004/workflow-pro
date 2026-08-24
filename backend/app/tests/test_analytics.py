import pytest


def test_dashboard_analytics_admin(client, admin_user_token_headers):
    res = client.get("/api/v1/dashboard/analytics", headers=admin_user_token_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["role"] == "admin"
    assert "summary" in data
    assert "tasks" in data
    assert "projects" in data
    assert "departments" in data
    assert "attendance" in data
    assert "leaves" in data

    assert isinstance(data["summary"]["total_employees"], int)
    assert isinstance(data["tasks"]["total"], int)
    assert isinstance(data["projects"]["total"], int)


def test_dashboard_analytics_employee(client, normal_user_token_headers):
    res = client.get("/api/v1/dashboard/analytics", headers=normal_user_token_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["role"] == "employee"
    assert data["departments"] == []  # Employee should not receive organization department metrics


def test_dashboard_analytics_unauthorized(client):
    res = client.get("/api/v1/dashboard/analytics")
    assert res.status_code == 401
