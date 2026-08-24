from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User


def test_create_department(client: TestClient, normal_user_token_headers: dict[str, str], admin_user_token_headers: dict[str, str]):
    # Need admin token to create department
    response = client.post(
        "/api/v1/departments",
        json={"name": "Engineering", "description": "Software"},
        headers=admin_user_token_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Engineering"
    assert data["description"] == "Software"
    assert data["is_active"] is True

    # Duplicate should fail
    response = client.post(
        "/api/v1/departments",
        json={"name": "Engineering"},
        headers=admin_user_token_headers,
    )
    assert response.status_code == 409


def test_list_departments(client: TestClient, admin_user_token_headers: dict[str, str], normal_user_token_headers: dict[str, str]):
    client.post("/api/v1/departments", json={"name": "HR"}, headers=admin_user_token_headers)
    client.post("/api/v1/departments", json={"name": "Sales"}, headers=admin_user_token_headers)

    response = client.get("/api/v1/departments", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    # At least the ones we created in this test and the previous test
    assert data["total"] >= 2


def test_employee_cannot_create_department(client: TestClient, normal_user_token_headers: dict[str, str]):
    response = client.post(
        "/api/v1/departments",
        json={"name": "Finance"},
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_tenant_isolation(client: TestClient, admin_user_token_headers: dict[str, str], other_company_admin_token_headers: dict[str, str]):
    # Create department in company A
    response1 = client.post(
        "/api/v1/departments",
        json={"name": "Company A Dept"},
        headers=admin_user_token_headers,
    )
    assert response1.status_code == 201
    dept_id = response1.json()["id"]

    # Try to access it from company B
    response2 = client.get(f"/api/v1/departments/{dept_id}", headers=other_company_admin_token_headers)
    assert response2.status_code == 404
