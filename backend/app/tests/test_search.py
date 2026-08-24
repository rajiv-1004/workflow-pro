import pytest


def test_global_search_across_entities(client, admin_user_token_headers):
    # Create department, project, task
    client.post(
        "/api/v1/departments",
        json={"name": "Quantum Search Dept", "description": "Search test department"},
        headers=admin_user_token_headers,
    )
    p_res = client.post(
        "/api/v1/projects",
        json={"name": "Quantum Search Project", "description": "Project search test"},
        headers=admin_user_token_headers,
    )
    proj_id = p_res.json()["id"]
    client.post(
        "/api/v1/tasks",
        json={"title": "Quantum Search Task", "project_id": proj_id},
        headers=admin_user_token_headers,
    )

    # Search for "Quantum"
    res = client.get("/api/v1/search?q=Quantum", headers=admin_user_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "Quantum"
    assert len(data["results"]["departments"]) >= 1
    assert len(data["results"]["projects"]) >= 1
    assert len(data["results"]["tasks"]) >= 1
    assert data["total"] >= 3


def test_global_search_short_query(client, admin_user_token_headers):
    res = client.get("/api/v1/search?q=a", headers=admin_user_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0


def test_global_search_multi_tenant_isolation(
    client, admin_user_token_headers, other_company_admin_token_headers
):
    # Create unique resource in Company A
    client.post(
        "/api/v1/departments",
        json={"name": "SecretCompanyADept", "description": "Confidential"},
        headers=admin_user_token_headers,
    )

    # Company B searches for SecretCompanyADept
    res = client.get("/api/v1/search?q=SecretCompanyA", headers=other_company_admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert len(data["results"]["departments"]) == 0
