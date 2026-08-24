from fastapi.testclient import TestClient

def test_list_employees(client: TestClient, admin_user_token_headers: dict[str, str], normal_user_token_headers: dict[str, str]):
    # Normal user can't list employees
    response = client.get("/api/v1/employees", headers=normal_user_token_headers)
    assert response.status_code == 403

    # Admin user can list employees
    response = client.get("/api/v1/employees", headers=admin_user_token_headers)
    assert response.status_code == 200
    assert "items" in response.json()
    assert len(response.json()["items"]) >= 1 # At least the admin user himself


def test_assign_department(client: TestClient, admin_user_token_headers: dict[str, str], normal_user_token_headers: dict[str, str]):
    # Admin creates a department
    response = client.post(
        "/api/v1/departments",
        json={"name": "Sales"},
        headers=admin_user_token_headers,
    )
    assert response.status_code == 201
    dept_id = response.json()["id"]

    # We need the employee's ID. Let's get it by fetching me as the normal user
    response = client.get("/api/v1/users/me", headers=normal_user_token_headers)
    employee_id = response.json()["id"]

    # Admin assigns employee to department
    response = client.patch(
        f"/api/v1/employees/{employee_id}/department",
        json={"department_id": dept_id},
        headers=admin_user_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["department_id"] == dept_id

    # Deactivate department
    client.delete(f"/api/v1/departments/{dept_id}", headers=admin_user_token_headers)

    # Cannot assign to inactive department
    # Wait, the normal user is already assigned, let's create a new dept
    response = client.post(
        "/api/v1/departments",
        json={"name": "Inactive Dept"},
        headers=admin_user_token_headers,
    )
    dept2_id = response.json()["id"]
    client.delete(f"/api/v1/departments/{dept2_id}", headers=admin_user_token_headers)

    response = client.patch(
        f"/api/v1/employees/{employee_id}/department",
        json={"department_id": dept2_id},
        headers=admin_user_token_headers,
    )
    assert response.status_code == 409


def test_tenant_isolation_employee(client: TestClient, admin_user_token_headers: dict[str, str], other_company_admin_token_headers: dict[str, str]):
    # Get employee from Company A
    response = client.get("/api/v1/employees", headers=admin_user_token_headers)
    emp_id = response.json()["items"][0]["id"]

    # Other company admin cannot assign department
    response = client.patch(
        f"/api/v1/employees/{emp_id}/department",
        json={"department_id": None},
        headers=other_company_admin_token_headers,
    )
    assert response.status_code == 404
