import uuid
from datetime import date, timedelta

import pytest
from fastapi import status


def _create_employee(client, admin_headers, email, name="Emp User"):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": name, "password": "Password123", "company_name": "Acme Corp"},
    )
    assert r.status_code == status.HTTP_201_CREATED
    r_login = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "Password123"},
    )
    assert r_login.status_code == status.HTTP_200_OK
    return {"Authorization": f"Bearer {r_login.json()['access_token']}"}


def test_create_leave_success(client, normal_user_token_headers):
    today = date.today()
    payload = {
        "leave_type": "ANNUAL",
        "start_date": (today + timedelta(days=5)).isoformat(),
        "end_date": (today + timedelta(days=10)).isoformat(),
        "reason": "Vacation trip",
    }
    r = client.post("/api/v1/leaves", json=payload, headers=normal_user_token_headers)
    assert r.status_code == status.HTTP_201_CREATED
    data = r.json()
    assert data["leave_type"] == "ANNUAL"
    assert data["status"] == "PENDING"
    assert data["reason"] == "Vacation trip"
    assert "id" in data


def test_create_leave_invalid_date_range(client, normal_user_token_headers):
    today = date.today()
    payload = {
        "leave_type": "SICK",
        "start_date": (today + timedelta(days=10)).isoformat(),
        "end_date": (today + timedelta(days=5)).isoformat(),
        "reason": "Backwards dates",
    }
    r = client.post("/api/v1/leaves", json=payload, headers=normal_user_token_headers)
    assert r.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_overlapping_leave_request_rejected(client, normal_user_token_headers):
    today = date.today()
    payload1 = {
        "leave_type": "CASUAL",
        "start_date": (today + timedelta(days=20)).isoformat(),
        "end_date": (today + timedelta(days=25)).isoformat(),
        "reason": "Family event",
    }
    r1 = client.post("/api/v1/leaves", json=payload1, headers=normal_user_token_headers)
    assert r1.status_code == status.HTTP_201_CREATED

    # Overlapping request
    payload2 = {
        "leave_type": "SICK",
        "start_date": (today + timedelta(days=22)).isoformat(),
        "end_date": (today + timedelta(days=27)).isoformat(),
        "reason": "Doctor appointment",
    }
    r2 = client.post("/api/v1/leaves", json=payload2, headers=normal_user_token_headers)
    assert r2.status_code == status.HTTP_409_CONFLICT


def test_list_leaves_rbac_and_filters(client, admin_user_token_headers, normal_user_token_headers):
    today = date.today()
    # Employee creates leave
    client.post(
        "/api/v1/leaves",
        json={
            "leave_type": "SICK",
            "start_date": (today + timedelta(days=30)).isoformat(),
            "end_date": (today + timedelta(days=32)).isoformat(),
            "reason": "Flu",
        },
        headers=normal_user_token_headers,
    )

    # Employee views own leaves
    r_emp = client.get("/api/v1/leaves", headers=normal_user_token_headers)
    assert r_emp.status_code == status.HTTP_200_OK
    assert r_emp.json()["total"] >= 1

    # Admin views company leaves
    r_admin = client.get("/api/v1/leaves", headers=admin_user_token_headers)
    assert r_admin.status_code == status.HTTP_200_OK
    assert r_admin.json()["total"] >= 1

    # Filter by leave_type
    r_type = client.get("/api/v1/leaves?leave_type=SICK", headers=admin_user_token_headers)
    assert r_type.status_code == status.HTTP_200_OK
    assert all(item["leave_type"] == "SICK" for item in r_type.json()["items"])

    # Filter by status
    r_status = client.get("/api/v1/leaves?status=PENDING", headers=admin_user_token_headers)
    assert r_status.status_code == status.HTTP_200_OK
    assert all(item["status"] == "PENDING" for item in r_status.json()["items"])


def test_approve_and_reject_leave_workflow(client, admin_user_token_headers, normal_user_token_headers):
    today = date.today()
    # Employee creates leave
    r_create = client.post(
        "/api/v1/leaves",
        json={
            "leave_type": "UNPAID",
            "start_date": (today + timedelta(days=40)).isoformat(),
            "end_date": (today + timedelta(days=42)).isoformat(),
            "reason": "Personal sabbatical",
        },
        headers=normal_user_token_headers,
    )
    leave_id = r_create.json()["id"]

    # Employee attempts to approve own leave -> 403
    r_self_approve = client.patch(f"/api/v1/leaves/{leave_id}/approve", headers=normal_user_token_headers)
    assert r_self_approve.status_code == status.HTTP_403_FORBIDDEN

    # Admin approves leave
    r_approve = client.patch(
        f"/api/v1/leaves/{leave_id}/approve",
        json={"review_comment": "Approved by management."},
        headers=admin_user_token_headers,
    )
    assert r_approve.status_code == status.HTTP_200_OK
    data = r_approve.json()
    assert data["status"] == "APPROVED"
    assert data["reviewed_by_id"] is not None
    assert data["reviewed_at"] is not None
    assert data["review_comment"] == "Approved by management."

    # Cannot re-approve already approved leave
    r_reapprove = client.patch(f"/api/v1/leaves/{leave_id}/approve", headers=admin_user_token_headers)
    assert r_reapprove.status_code == status.HTTP_409_CONFLICT


def test_reject_leave_workflow(client, admin_user_token_headers, normal_user_token_headers):
    today = date.today()
    r_create = client.post(
        "/api/v1/leaves",
        json={
            "leave_type": "OTHER",
            "start_date": (today + timedelta(days=50)).isoformat(),
            "end_date": (today + timedelta(days=52)).isoformat(),
            "reason": "Conference",
        },
        headers=normal_user_token_headers,
    )
    leave_id = r_create.json()["id"]

    # Admin rejects leave
    r_reject = client.patch(
        f"/api/v1/leaves/{leave_id}/reject",
        json={"review_comment": "Peak project delivery week."},
        headers=admin_user_token_headers,
    )
    assert r_reject.status_code == status.HTTP_200_OK
    data = r_reject.json()
    assert data["status"] == "REJECTED"
    assert data["review_comment"] == "Peak project delivery week."


def test_cancel_leave_request(client, normal_user_token_headers):
    today = date.today()
    r_create = client.post(
        "/api/v1/leaves",
        json={
            "leave_type": "CASUAL",
            "start_date": (today + timedelta(days=60)).isoformat(),
            "end_date": (today + timedelta(days=62)).isoformat(),
            "reason": "Cancelled trip",
        },
        headers=normal_user_token_headers,
    )
    leave_id = r_create.json()["id"]

    # Cancel
    r_cancel = client.patch(f"/api/v1/leaves/{leave_id}/cancel", headers=normal_user_token_headers)
    assert r_cancel.status_code == status.HTTP_200_OK
    assert r_cancel.json()["status"] == "CANCELLED"


def test_cross_company_leave_access_rejected(
    client, normal_user_token_headers, other_company_admin_token_headers
):
    today = date.today()
    r_create = client.post(
        "/api/v1/leaves",
        json={
            "leave_type": "ANNUAL",
            "start_date": (today + timedelta(days=70)).isoformat(),
            "end_date": (today + timedelta(days=75)).isoformat(),
            "reason": "Company A Secret Leave",
        },
        headers=normal_user_token_headers,
    )
    leave_id = r_create.json()["id"]

    # Company B tries to get it -> 404
    r_b_get = client.get(f"/api/v1/leaves/{leave_id}", headers=other_company_admin_token_headers)
    assert r_b_get.status_code == status.HTTP_404_NOT_FOUND

    # Company B tries to approve it -> 404
    r_b_approve = client.patch(f"/api/v1/leaves/{leave_id}/approve", headers=other_company_admin_token_headers)
    assert r_b_approve.status_code == status.HTTP_404_NOT_FOUND
