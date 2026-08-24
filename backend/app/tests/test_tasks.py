import uuid
from datetime import datetime, timezone, timedelta

import pytest
from fastapi import status


def _create_project(client, headers, name="Default Task Project"):
    r = client.post("/api/v1/projects", json={"name": name, "description": "Project for tasks"}, headers=headers)
    assert r.status_code == status.HTTP_201_CREATED
    return r.json()["id"]


def test_create_task_success(client, admin_user_token_headers):
    proj_id = _create_project(client, admin_user_token_headers, name="Task Project 1")
    payload = {
        "title": "Build authentication UI",
        "description": "Implement login and registration forms",
        "project_id": proj_id,
        "priority": "HIGH",
        "status": "TODO",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    }
    r = client.post("/api/v1/tasks", json=payload, headers=admin_user_token_headers)
    assert r.status_code == status.HTTP_201_CREATED
    data = r.json()
    assert data["title"] == "Build authentication UI"
    assert data["priority"] == "HIGH"
    assert data["status"] == "TODO"
    assert data["project_id"] == proj_id
    assert data["completed_at"] is None
    assert data["is_active"] is True
    assert "id" in data


def test_create_task_invalid_project(client, admin_user_token_headers):
    fake_proj_id = str(uuid.uuid4())
    payload = {
        "title": "Invalid Task",
        "project_id": fake_proj_id,
    }
    r = client.post("/api/v1/tasks", json=payload, headers=admin_user_token_headers)
    assert r.status_code == status.HTTP_404_NOT_FOUND


def test_create_task_inactive_project(client, admin_user_token_headers):
    proj_id = _create_project(client, admin_user_token_headers, name="Project to Deactivate First")
    client.patch(f"/api/v1/projects/{proj_id}/deactivate", headers=admin_user_token_headers)

    payload = {
        "title": "Task for Inactive Project",
        "project_id": proj_id,
    }
    r = client.post("/api/v1/tasks", json=payload, headers=admin_user_token_headers)
    assert r.status_code == status.HTTP_409_CONFLICT


def test_list_and_filter_tasks(client, admin_user_token_headers):
    proj_id = _create_project(client, admin_user_token_headers, name="Filter Tasks Project")
    client.post(
        "/api/v1/tasks",
        json={"title": "Fix database bug", "description": "urgent fix", "project_id": proj_id, "priority": "URGENT", "status": "IN_PROGRESS"},
        headers=admin_user_token_headers,
    )
    client.post(
        "/api/v1/tasks",
        json={"title": "Write unit tests", "description": "testing suite", "project_id": proj_id, "priority": "MEDIUM", "status": "TODO"},
        headers=admin_user_token_headers,
    )

    # Search
    r_search = client.get("/api/v1/tasks?search=bug", headers=admin_user_token_headers)
    assert r_search.status_code == status.HTTP_200_OK
    assert r_search.json()["total"] >= 1
    assert "bug" in r_search.json()["items"][0]["title"]

    # Filter priority
    r_priority = client.get("/api/v1/tasks?priority=URGENT", headers=admin_user_token_headers)
    assert r_priority.status_code == status.HTTP_200_OK
    assert all(item["priority"] == "URGENT" for item in r_priority.json()["items"])

    # Filter status
    r_status = client.get("/api/v1/tasks?status=IN_PROGRESS", headers=admin_user_token_headers)
    assert r_status.status_code == status.HTTP_200_OK
    assert all(item["status"] == "IN_PROGRESS" for item in r_status.json()["items"])

    # Filter project
    r_proj = client.get(f"/api/v1/tasks?project_id={proj_id}", headers=admin_user_token_headers)
    assert r_proj.status_code == status.HTTP_200_OK
    assert len(r_proj.json()["items"]) == 2


def test_assign_task_same_company_vs_cross_company(
    client, admin_user_token_headers, other_company_admin_token_headers
):
    proj_id = _create_project(client, admin_user_token_headers, name="Assignment Project")
    r_task = client.post(
        "/api/v1/tasks",
        json={"title": "Task to Assign", "project_id": proj_id},
        headers=admin_user_token_headers,
    )
    task_id = r_task.json()["id"]

    # Get employee in company A
    r_emp_list = client.get("/api/v1/employees", headers=admin_user_token_headers)
    emp_a_id = r_emp_list.json()["items"][0]["id"]

    # Get employee in company B
    r_emp_b_list = client.get("/api/v1/employees", headers=other_company_admin_token_headers)
    emp_b_id = r_emp_b_list.json()["items"][0]["id"]

    # Assign to employee A -> Success
    r_assign = client.patch(
        f"/api/v1/tasks/{task_id}/assign",
        json={"assigned_to_id": emp_a_id},
        headers=admin_user_token_headers,
    )
    assert r_assign.status_code == status.HTTP_200_OK
    assert r_assign.json()["assigned_to_id"] == emp_a_id

    # Assign to employee B -> 404 (employee not found in tenant company)
    r_cross_assign = client.patch(
        f"/api/v1/tasks/{task_id}/assign",
        json={"assigned_to_id": emp_b_id},
        headers=admin_user_token_headers,
    )
    assert r_cross_assign.status_code == status.HTTP_404_NOT_FOUND


def test_reject_inactive_employee_assignment(client, admin_user_token_headers):
    proj_id = _create_project(client, admin_user_token_headers, name="Inactive Emp Project")
    r_task = client.post(
        "/api/v1/tasks",
        json={"title": "Task for Inactive Emp", "project_id": proj_id},
        headers=admin_user_token_headers,
    )
    task_id = r_task.json()["id"]

    # Register employee then deactivate
    client.post(
        "/api/v1/auth/register",
        json={"email": "inactive.emp@acme.com", "full_name": "Inactive Emp", "password": "Password123", "company_name": "Acme Corp"},
    )
    r_emps = client.get("/api/v1/employees?search=inactive.emp@acme.com", headers=admin_user_token_headers)
    emp_id = r_emps.json()["items"][0]["id"]

    # Deactivate employee
    client.patch(f"/api/v1/employees/{emp_id}/deactivate", headers=admin_user_token_headers)

    # Attempt to assign
    r_assign = client.patch(
        f"/api/v1/tasks/{task_id}/assign",
        json={"assigned_to_id": emp_id},
        headers=admin_user_token_headers,
    )
    assert r_assign.status_code == status.HTTP_409_CONFLICT


def test_task_completion_lifecycle(client, admin_user_token_headers):
    proj_id = _create_project(client, admin_user_token_headers, name="Lifecycle Project")
    r_task = client.post(
        "/api/v1/tasks",
        json={"title": "Task with Completion Lifecycle", "project_id": proj_id, "status": "TODO"},
        headers=admin_user_token_headers,
    )
    task_id = r_task.json()["id"]
    assert r_task.json()["completed_at"] is None

    # Complete via complete endpoint
    r_complete = client.patch(f"/api/v1/tasks/{task_id}/complete", headers=admin_user_token_headers)
    assert r_complete.status_code == status.HTTP_200_OK
    assert r_complete.json()["status"] == "COMPLETED"
    assert r_complete.json()["completed_at"] is not None

    # Reopen via status update
    r_reopen = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_user_token_headers,
    )
    assert r_reopen.status_code == status.HTTP_200_OK
    assert r_reopen.json()["status"] == "IN_PROGRESS"
    assert r_reopen.json()["completed_at"] is None

    # Complete via status update
    r_complete2 = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "COMPLETED"},
        headers=admin_user_token_headers,
    )
    assert r_complete2.status_code == status.HTTP_200_OK
    assert r_complete2.json()["status"] == "COMPLETED"
    assert r_complete2.json()["completed_at"] is not None


def test_deactivate_task(client, admin_user_token_headers):
    proj_id = _create_project(client, admin_user_token_headers, name="Deact Task Project")
    r_task = client.post(
        "/api/v1/tasks",
        json={"title": "Task to Deactivate", "project_id": proj_id},
        headers=admin_user_token_headers,
    )
    task_id = r_task.json()["id"]

    r_deact = client.patch(f"/api/v1/tasks/{task_id}/deactivate", headers=admin_user_token_headers)
    assert r_deact.status_code == status.HTTP_200_OK
    assert r_deact.json()["is_active"] is False

    # Modification of inactive task rejected
    r_mod = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"title": "New Title"},
        headers=admin_user_token_headers,
    )
    assert r_mod.status_code == status.HTTP_409_CONFLICT


def test_cross_company_task_access_rejected(
    client, admin_user_token_headers, other_company_admin_token_headers
):
    proj_id = _create_project(client, admin_user_token_headers, name="Company A Task Project")
    r_task = client.post(
        "/api/v1/tasks",
        json={"title": "Secret Company A Task", "project_id": proj_id},
        headers=admin_user_token_headers,
    )
    task_id = r_task.json()["id"]

    # Company B cannot get it
    r_b_get = client.get(f"/api/v1/tasks/{task_id}", headers=other_company_admin_token_headers)
    assert r_b_get.status_code == status.HTTP_404_NOT_FOUND

    # Company B cannot patch it
    r_b_patch = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Hacked Task"},
        headers=other_company_admin_token_headers,
    )
    assert r_b_patch.status_code == status.HTTP_404_NOT_FOUND

    # Company B cannot complete it
    r_b_comp = client.patch(f"/api/v1/tasks/{task_id}/complete", headers=other_company_admin_token_headers)
    assert r_b_comp.status_code == status.HTTP_404_NOT_FOUND
