import uuid
from datetime import date

import pytest
from fastapi import status


def test_attendance_checkin_and_checkout_flow(client, normal_user_token_headers):
    # Check-in
    r_in = client.post("/api/v1/attendance/check-in", headers=normal_user_token_headers)
    assert r_in.status_code == status.HTTP_201_CREATED
    data_in = r_in.json()
    assert data_in["status"] == "PRESENT"
    assert data_in["check_in"] is not None
    assert data_in["check_out"] is None
    assert data_in["working_minutes"] == 0
    assert "id" in data_in

    # Duplicate check-in -> 409
    r_dup_in = client.post("/api/v1/attendance/check-in", headers=normal_user_token_headers)
    assert r_dup_in.status_code == status.HTTP_409_CONFLICT

    # Check-out
    r_out = client.patch("/api/v1/attendance/check-out", headers=normal_user_token_headers)
    assert r_out.status_code == status.HTTP_200_OK
    data_out = r_out.json()
    assert data_out["check_out"] is not None
    assert data_out["working_minutes"] >= 0

    # Duplicate check-out -> 409
    r_dup_out = client.patch("/api/v1/attendance/check-out", headers=normal_user_token_headers)
    assert r_dup_out.status_code == status.HTTP_409_CONFLICT


def test_checkout_without_checkin_rejected(client, admin_user_token_headers):
    # Admin has not checked in today
    r_out = client.patch("/api/v1/attendance/check-out", headers=admin_user_token_headers)
    assert r_out.status_code == status.HTTP_404_NOT_FOUND


def test_attendance_history_and_summary(client, normal_user_token_headers):
    # Check-in
    client.post("/api/v1/attendance/check-in", headers=normal_user_token_headers)

    r_history = client.get("/api/v1/attendance/me", headers=normal_user_token_headers)
    assert r_history.status_code == status.HTTP_200_OK
    assert r_history.json()["total"] >= 1

    r_summary = client.get("/api/v1/attendance/summary/me", headers=normal_user_token_headers)
    assert r_summary.status_code == status.HTTP_200_OK
    summary = r_summary.json()
    assert "total_days" in summary
    assert "present_days" in summary
    assert "total_working_minutes" in summary


def test_admin_list_attendance_and_filters(client, admin_user_token_headers, normal_user_token_headers):
    # Normal user checks in
    client.post("/api/v1/attendance/check-in", headers=normal_user_token_headers)

    # Admin lists company attendance
    r_list = client.get("/api/v1/attendance", headers=admin_user_token_headers)
    assert r_list.status_code == status.HTTP_200_OK
    assert r_list.json()["total"] >= 1

    # Filter status
    r_filter = client.get("/api/v1/attendance?status=PRESENT", headers=admin_user_token_headers)
    assert r_filter.status_code == status.HTTP_200_OK
    assert all(item["status"] == "PRESENT" for item in r_filter.json()["items"])


def test_cross_company_attendance_access_rejected(
    client, normal_user_token_headers, other_company_admin_token_headers
):
    # Normal user checks in
    r_in = client.post("/api/v1/attendance/check-in", headers=normal_user_token_headers)
    att_id = r_in.json()["id"]

    # Company B tries to get it -> 404
    r_b_get = client.get(f"/api/v1/attendance/{att_id}", headers=other_company_admin_token_headers)
    assert r_b_get.status_code == status.HTTP_404_NOT_FOUND
