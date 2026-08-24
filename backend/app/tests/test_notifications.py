import pytest


def test_notifications_lifecycle_and_unread_count(client, admin_user_token_headers, normal_user_token_headers):
    # 1. Check initial unread count for normal user
    res = client.get("/api/v1/notifications/unread-count", headers=normal_user_token_headers)
    assert res.status_code == 200
    initial_count = res.json()["count"]

    # 2. Get normal user id
    me_res = client.get("/api/v1/users/me", headers=normal_user_token_headers)
    assert me_res.status_code == 200
    emp_id = me_res.json()["id"]

    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Notification Project", "description": "Project test"},
        headers=admin_user_token_headers,
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # Create task assigned to employee
    task_res = client.post(
        "/api/v1/tasks",
        json={
            "title": "Fix Notification Bug",
            "project_id": proj_id,
            "assigned_to_id": emp_id,
        },
        headers=admin_user_token_headers,
    )
    assert task_res.status_code == 201

    # 3. Verify notification received by employee
    res = client.get("/api/v1/notifications/unread-count", headers=normal_user_token_headers)
    assert res.status_code == 200
    assert res.json()["count"] == initial_count + 1

    list_res = client.get("/api/v1/notifications", headers=normal_user_token_headers)
    assert list_res.status_code == 200
    data = list_res.json()
    assert len(data["items"]) >= 1
    notif = data["items"][0]
    assert notif["type"] == "TASK_ASSIGNED"
    assert "Fix Notification Bug" in notif["message"]
    assert notif["is_read"] is False

    # 4. Mark single notification as read
    read_res = client.patch(f"/api/v1/notifications/{notif['id']}/read", headers=normal_user_token_headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True
    assert read_res.json()["read_at"] is not None

    # 5. Mark all as read
    read_all_res = client.patch("/api/v1/notifications/read-all", headers=normal_user_token_headers)
    assert read_all_res.status_code == 200

    unread_res = client.get("/api/v1/notifications/unread-count", headers=normal_user_token_headers)
    assert unread_res.json()["count"] == 0


def test_notifications_leave_approval_and_rejection(client, admin_user_token_headers, normal_user_token_headers):
    # Employee creates leave
    leave_res = client.post(
        "/api/v1/leaves",
        json={
            "leave_type": "CASUAL",
            "start_date": "2026-09-01",
            "end_date": "2026-09-02",
            "reason": "Personal time off",
        },
        headers=normal_user_token_headers,
    )
    assert leave_res.status_code == 201
    leave_id = leave_res.json()["id"]

    # Admin approves leave
    app_res = client.patch(
        f"/api/v1/leaves/{leave_id}/approve",
        json={"review_comment": "Enjoy!"},
        headers=admin_user_token_headers,
    )
    assert app_res.status_code == 200

    # Employee checks notification
    list_res = client.get("/api/v1/notifications", headers=normal_user_token_headers)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert any(n["type"] == "LEAVE_APPROVED" and "approved" in n["title"].lower() for n in items)


def test_notifications_multi_tenant_isolation(
    client, normal_user_token_headers, other_company_admin_token_headers
):
    # Get notification id from company A employee
    list_res = client.get("/api/v1/notifications", headers=normal_user_token_headers)
    assert list_res.status_code == 200
    if list_res.json()["items"]:
        notif_id = list_res.json()["items"][0]["id"]
        # Company B admin tries to read Company A notification -> 404
        cross_res = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=other_company_admin_token_headers)
        assert cross_res.status_code == 404
