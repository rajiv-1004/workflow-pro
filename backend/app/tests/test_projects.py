import uuid
from datetime import datetime, timezone, timedelta

import pytest
from fastapi import status


def _create_department(client, headers, name="Engineering"):
    r = client.post("/api/v1/departments", json={"name": name, "description": "Dept desc"}, headers=headers)
    assert r.status_code == status.HTTP_201_CREATED
    return r.json()["id"]


def test_create_project_success_admin(client, admin_user_token_headers):
    dept_id = _create_department(client, admin_user_token_headers, name="Backend Dept")
    payload = {
        "name": "Project Apollo",
        "description": "To the moon",
        "status": "PLANNING",
        "department_id": dept_id,
        "start_date": datetime.now(timezone.utc).isoformat(),
        "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
    }
    r = client.post("/api/v1/projects", json=payload, headers=admin_user_token_headers)
    assert r.status_code == status.HTTP_201_CREATED
    data = r.json()
    assert data["name"] == "Project Apollo"
    assert data["status"] == "PLANNING"
    assert data["department_id"] == dept_id
    assert data["is_active"] is True
    assert "id" in data


def test_create_project_unauthorized_employee(client, normal_user_token_headers):
    payload = {
        "name": "Unauthorized Project",
        "description": "Should fail",
    }
    r = client.post("/api/v1/projects", json=payload, headers=normal_user_token_headers)
    assert r.status_code == status.HTTP_403_FORBIDDEN


def test_duplicate_project_name(client, admin_user_token_headers):
    payload = {
        "name": "Unique Project Alpha",
        "description": "First instance",
    }
    r1 = client.post("/api/v1/projects", json=payload, headers=admin_user_token_headers)
    assert r1.status_code == status.HTTP_201_CREATED

    r2 = client.post("/api/v1/projects", json=payload, headers=admin_user_token_headers)
    assert r2.status_code == status.HTTP_409_CONFLICT


def test_invalid_dates_project(client, admin_user_token_headers):
    start = datetime.now(timezone.utc)
    due = start - timedelta(days=5)
    payload = {
        "name": "Time Travel Project",
        "start_date": start.isoformat(),
        "due_date": due.isoformat(),
    }
    r = client.post("/api/v1/projects", json=payload, headers=admin_user_token_headers)
    assert r.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_invalid_manager_or_department(client, admin_user_token_headers):
    fake_uuid = str(uuid.uuid4())
    payload = {
        "name": "Project with Fake Dept",
        "department_id": fake_uuid,
    }
    r = client.post("/api/v1/projects", json=payload, headers=admin_user_token_headers)
    assert r.status_code == status.HTTP_404_NOT_FOUND

    payload2 = {
        "name": "Project with Fake Manager",
        "manager_id": fake_uuid,
    }
    r2 = client.post("/api/v1/projects", json=payload2, headers=admin_user_token_headers)
    assert r2.status_code == status.HTTP_404_NOT_FOUND


def test_list_and_filter_projects(client, admin_user_token_headers):
    dept_id = _create_department(client, admin_user_token_headers, name="Filter Dept")
    
    client.post(
        "/api/v1/projects",
        json={"name": "Alpha Web App", "status": "ACTIVE", "department_id": dept_id},
        headers=admin_user_token_headers,
    )
    client.post(
        "/api/v1/projects",
        json={"name": "Beta Mobile App", "status": "PLANNING"},
        headers=admin_user_token_headers,
    )

    # Search
    r = client.get("/api/v1/projects?search=Web", headers=admin_user_token_headers)
    assert r.status_code == status.HTTP_200_OK
    data = r.json()
    assert data["total"] >= 1
    assert all("Web" in item["name"] for item in data["items"])

    # Filter status
    r_status = client.get("/api/v1/projects?status=ACTIVE", headers=admin_user_token_headers)
    assert r_status.status_code == status.HTTP_200_OK
    assert all(item["status"] == "ACTIVE" for item in r_status.json()["items"])

    # Filter department
    r_dept = client.get(f"/api/v1/projects?department_id={dept_id}", headers=admin_user_token_headers)
    assert r_dept.status_code == status.HTTP_200_OK
    assert all(item["department_id"] == dept_id for item in r_dept.json()["items"])

    # Sorting
    r_sort = client.get("/api/v1/projects?sort_by=name&sort_order=asc", headers=admin_user_token_headers)
    assert r_sort.status_code == status.HTTP_200_OK


def test_get_and_update_project(client, admin_user_token_headers):
    r = client.post(
        "/api/v1/projects",
        json={"name": "Project Gamma", "description": "Old description"},
        headers=admin_user_token_headers,
    )
    assert r.status_code == status.HTTP_201_CREATED
    proj_id = r.json()["id"]

    # Get
    r_get = client.get(f"/api/v1/projects/{proj_id}", headers=admin_user_token_headers)
    assert r_get.status_code == status.HTTP_200_OK
    assert r_get.json()["id"] == proj_id

    # Patch
    r_patch = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"description": "Updated description", "name": "Project Gamma Updated"},
        headers=admin_user_token_headers,
    )
    assert r_patch.status_code == status.HTTP_200_OK
    assert r_patch.json()["description"] == "Updated description"
    assert r_patch.json()["name"] == "Project Gamma Updated"

    # Patch status
    r_status = client.patch(
        f"/api/v1/projects/{proj_id}/status",
        json={"status": "COMPLETED"},
        headers=admin_user_token_headers,
    )
    assert r_status.status_code == status.HTTP_200_OK
    assert r_status.json()["status"] == "COMPLETED"


def test_deactivate_project(client, admin_user_token_headers):
    r = client.post(
        "/api/v1/projects",
        json={"name": "Project to Deactivate"},
        headers=admin_user_token_headers,
    )
    proj_id = r.json()["id"]

    r_deact = client.patch(f"/api/v1/projects/{proj_id}/deactivate", headers=admin_user_token_headers)
    assert r_deact.status_code == status.HTTP_200_OK
    assert r_deact.json()["is_active"] is False

    # Attempting to update deactivated project
    r_update = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"description": "Try update"},
        headers=admin_user_token_headers,
    )
    assert r_update.status_code == status.HTTP_409_CONFLICT


def test_cross_company_project_access_rejected(
    client, admin_user_token_headers, other_company_admin_token_headers
):
    # Company A creates project
    r = client.post(
        "/api/v1/projects",
        json={"name": "Company A Secret Project"},
        headers=admin_user_token_headers,
    )
    assert r.status_code == status.HTTP_201_CREATED
    proj_id = r.json()["id"]

    # Company B tries to get it -> 404
    r_b_get = client.get(f"/api/v1/projects/{proj_id}", headers=other_company_admin_token_headers)
    assert r_b_get.status_code == status.HTTP_404_NOT_FOUND

    # Company B tries to patch it -> 404
    r_b_patch = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"name": "Hacked Name"},
        headers=other_company_admin_token_headers,
    )
    assert r_b_patch.status_code == status.HTTP_404_NOT_FOUND

    # Company B tries to patch status -> 404
    r_b_status = client.patch(
        f"/api/v1/projects/{proj_id}/status",
        json={"status": "CANCELLED"},
        headers=other_company_admin_token_headers,
    )
    assert r_b_status.status_code == status.HTTP_404_NOT_FOUND
