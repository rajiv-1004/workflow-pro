import httpx
import time
import subprocess
import os
import sys


# ============================================================
# Configuration
# ============================================================

BACKEND_DIR = r"C:\Users\91637\Downloads\workflow-pro-week1\workflow-pro\backend"
BASE_URL = "http://127.0.0.1:8005"


# ============================================================
# Start FastAPI server
# ============================================================

print("Starting Uvicorn server...")

env = os.environ.copy()

server_process = subprocess.Popen(
    [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--port",
        "8005",
    ],
    cwd=BACKEND_DIR,
    env=env,
)


# Give the server time to start
time.sleep(3)

client = httpx.Client(base_url=BASE_URL, timeout=10.0)


try:
    # ========================================================
    # 1. Health check
    # ========================================================

    print("\nTesting /health...")

    r = client.get("/health")

    assert r.status_code == 200, (
        f"Health check failed: {r.status_code} {r.text}"
    )

    print("Health check OK!")


    # ========================================================
    # 2. Register a new user
    # ========================================================

    timestamp = int(time.time())

    email = f"testadmin_{timestamp}@example.com"

    print(f"\nRegistering new user: {email}")

    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "E2E Admin",
            "password": "Password123",
            "company_name": f"E2E Company {timestamp}",
        },
    )

    assert r.status_code == 201, (
        f"Registration failed: {r.status_code} {r.text}"
    )

    print("Registration OK!")


    # ========================================================
    # 3. Promote registered user to admin
    # ========================================================

    print("\nPromoting test user to admin...")

    # Import application database/models
    sys.path.append(BACKEND_DIR)

    from app.db.session import SessionLocal
    from app.models.user import User
    from app.models.role import Role

    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        assert user is not None, "Registered user could not be found."

        admin_role = (
            db.query(Role)
            .filter(Role.name == "admin")
            .first()
        )

        if not admin_role:
            admin_role = Role(name="admin")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)

        user.role_id = admin_role.id

        db.commit()

    finally:
        db.close()

    print("User promoted to admin!")


    # ========================================================
    # 4. Login
    # ========================================================

    print("\nLogging in...")

    r = client.post(
        "/api/v1/auth/login",
        data={
            "username": email,
            "password": "Password123",
        },
    )

    assert r.status_code == 200, (
        f"Login failed: {r.status_code} {r.text}"
    )

    login_data = r.json()

    assert "access_token" in login_data, (
        f"Login response does not contain access_token: {login_data}"
    )

    token = login_data["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    print("Login OK!")


    # ========================================================
    # 5. Create Department
    # ========================================================

    dept_name = f"E2E Engineering {timestamp}"

    print(f"\nCreating department: {dept_name}")

    r = client.post(
        "/api/v1/departments",
        json={
            "name": dept_name,
            "description": "Integration Testing",
        },
        headers=headers,
    )

    assert r.status_code == 201, (
        f"Create department failed: {r.status_code} {r.text}"
    )

    department_data = r.json()

    assert "id" in department_data, (
        f"Department response does not contain id: {department_data}"
    )

    dept_id = department_data["id"]

    print("Create department OK!")


    # ========================================================
    # 6. List Departments
    # ========================================================

    print("\nListing departments...")

    r = client.get(
        "/api/v1/departments",
        headers=headers,
    )

    assert r.status_code == 200, (
        f"List departments failed: {r.status_code} {r.text}"
    )

    departments_data = r.json()

    assert "items" in departments_data, (
        f"Department list response does not contain items: "
        f"{departments_data}"
    )

    assert len(departments_data["items"]) >= 1, (
        "Department list is empty."
    )

    print("List departments OK!")


    # ========================================================
    # 7. List Employees
    # ========================================================

    print("\nListing employees...")

    r = client.get(
        "/api/v1/employees",
        headers=headers,
    )

    assert r.status_code == 200, (
        f"List employees failed: {r.status_code} {r.text}"
    )

    employees_data = r.json()

    assert "items" in employees_data, (
        f"Employee list response does not contain items: "
        f"{employees_data}"
    )

    assert len(employees_data["items"]) >= 1, (
        "Employee list is empty."
    )

    emp_id = employees_data["items"][0]["id"]

    print(f"List employees OK! Employee ID: {emp_id}")


    # ========================================================
    # 8. Assign Employee to Department
    # ========================================================

    print("\nAssigning employee to department...")

    r = client.patch(
        f"/api/v1/employees/{emp_id}/department",
        json={
            "department_id": dept_id,
        },
        headers=headers,
    )

    assert r.status_code == 200, (
        f"Assign department failed: {r.status_code} {r.text}"
    )

    print("Assign department OK!")


    # ========================================================
    # 9. Get Employee Details
    # ========================================================

    print("\nVerifying employee details...")

    r = client.get(
        f"/api/v1/employees/{emp_id}",
        headers=headers,
    )

    assert r.status_code == 200, (
        f"Get employee failed: {r.status_code} {r.text}"
    )

    employee_data = r.json()

    assert employee_data["department_id"] == dept_id, (
        "Employee department_id does not match the assigned department."
    )

    print("Get employee OK!")


    # ========================================================
    # 10. Create Project
    # ========================================================

    project_name = f"E2E SaaS Launch {timestamp}"
    print(f"\nCreating project: {project_name}")

    r = client.post(
        "/api/v1/projects",
        json={
            "name": project_name,
            "description": "Launch enterprise SaaS workflow features",
            "department_id": dept_id,
            "status": "PLANNING",
        },
        headers=headers,
    )

    assert r.status_code == 201, (
        f"Create project failed: {r.status_code} {r.text}"
    )

    project_data = r.json()
    assert "id" in project_data, f"Project response does not contain id: {project_data}"
    project_id = project_data["id"]
    print("Create project OK!")


    # ========================================================
    # 11. List Projects
    # ========================================================

    print("\nListing projects...")

    r = client.get(
        f"/api/v1/projects?search={project_name}",
        headers=headers,
    )

    assert r.status_code == 200, (
        f"List projects failed: {r.status_code} {r.text}"
    )

    projects_data = r.json()
    assert projects_data["total"] >= 1, "Project search returned 0 items."
    print("List projects OK!")


    # ========================================================
    # 12. Create Task
    # ========================================================

    task_title = f"Implement OAuth integration {timestamp}"
    print(f"\nCreating task: {task_title}")

    r = client.post(
        "/api/v1/tasks",
        json={
            "title": task_title,
            "description": "Add Google and GitHub OAuth login providers",
            "project_id": project_id,
            "priority": "HIGH",
            "status": "TODO",
        },
        headers=headers,
    )

    assert r.status_code == 201, (
        f"Create task failed: {r.status_code} {r.text}"
    )

    task_data = r.json()
    assert "id" in task_data, f"Task response does not contain id: {task_data}"
    task_id = task_data["id"]
    print("Create task OK!")


    # ========================================================
    # 13. List Tasks
    # ========================================================

    print("\nListing tasks...")

    r = client.get(
        f"/api/v1/tasks?project_id={project_id}",
        headers=headers,
    )

    assert r.status_code == 200, (
        f"List tasks failed: {r.status_code} {r.text}"
    )

    tasks_data = r.json()
    assert tasks_data["total"] >= 1, "Task list returned 0 items."
    print("List tasks OK!")


    # ========================================================
    # 14. Assign Task
    # ========================================================

    print("\nAssigning task...")

    r = client.patch(
        f"/api/v1/tasks/{task_id}/assign",
        json={
            "assigned_to_id": emp_id,
        },
        headers=headers,
    )

    assert r.status_code == 200, (
        f"Assign task failed: {r.status_code} {r.text}"
    )

    assert r.json()["assigned_to_id"] == emp_id, "Task assigned_to_id mismatch."
    print("Assign task OK!")


    # ========================================================
    # 15. Update Task Status to IN_PROGRESS
    # ========================================================

    print("\nUpdating task status...")

    r = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={
            "status": "IN_PROGRESS",
        },
        headers=headers,
    )

    assert r.status_code == 200, (
        f"Update task status failed: {r.status_code} {r.text}"
    )
    assert r.json()["status"] == "IN_PROGRESS"
    print("Update task status OK!")


    # ========================================================
    # 16. Complete Task & Verify completed_at
    # ========================================================

    print("\nCompleting task...")

    r = client.patch(
        f"/api/v1/tasks/{task_id}/complete",
        headers=headers,
    )

    assert r.status_code == 200, (
        f"Complete task failed: {r.status_code} {r.text}"
    )

    completed_task = r.json()
    assert completed_task["status"] == "COMPLETED"
    assert completed_task["completed_at"] is not None, "completed_at timestamp was not set!"
    print("Complete task OK! completed_at verified.")


    # ========================================================
    # 17. Reopen Task & Verify completed_at is cleared
    # ========================================================

    print("\nReopening task...")

    r = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={
            "status": "TODO",
        },
        headers=headers,
    )

    assert r.status_code == 200, (
        f"Reopen task failed: {r.status_code} {r.text}"
    )

    reopened_task = r.json()
    assert reopened_task["status"] == "TODO"
    assert reopened_task["completed_at"] is None, "completed_at was not cleared upon reopening!"
    print("Reopen task OK! completed_at cleared verified.")


    # ========================================================
    # 18. Retrieve Task Details
    # ========================================================

    print("\nRetrieving task details...")

    r = client.get(
        f"/api/v1/tasks/{task_id}",
        headers=headers,
    )

    assert r.status_code == 200, (
        f"Get task details failed: {r.status_code} {r.text}"
    )
    print("Get task details OK!")


    # ========================================================
    # 20. Register an Employee for Company A
    # ========================================================

    emp_email = f"employee_{timestamp}@example.com"
    print(f"\nRegistering company employee: {emp_email}")

    r_reg_emp = client.post(
        "/api/v1/auth/register",
        json={
            "email": emp_email,
            "full_name": "E2E Regular Employee",
            "password": "Password123",
            "company_name": f"E2E Company {timestamp}",
        },
    )
    assert r_reg_emp.status_code == 201, f"Employee registration failed: {r_reg_emp.text}"

    r_login_emp = client.post(
        "/api/v1/auth/login",
        data={"username": emp_email, "password": "Password123"},
    )
    assert r_login_emp.status_code == 200, f"Employee login failed: {r_login_emp.text}"
    emp_token = r_login_emp.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    print("Employee registered and logged in OK!")


    # ========================================================
    # 21. Create Leave Request by Employee
    # ========================================================

    print("\nCreating leave request by employee...")

    r = client.post(
        "/api/v1/leaves",
        json={
            "leave_type": "ANNUAL",
            "start_date": "2026-09-01",
            "end_date": "2026-09-05",
            "reason": "Annual Vacation",
        },
        headers=emp_headers,
    )

    assert r.status_code == 201, f"Create leave failed: {r.status_code} {r.text}"
    leave_data = r.json()
    assert "id" in leave_data, f"Leave response does not contain id: {leave_data}"
    leave_id = leave_data["id"]
    print("Create leave request OK!")


    # ========================================================
    # 22. List Leave Requests
    # ========================================================

    print("\nListing leave requests...")

    r = client.get(
        "/api/v1/leaves",
        headers=headers,
    )

    assert r.status_code == 200, f"List leaves failed: {r.status_code} {r.text}"
    assert r.json()["total"] >= 1, "Leave list returned 0 items."
    print("List leave requests OK!")


    # ========================================================
    # 23. Admin Approves Leave Request & Verify Reviewer
    # ========================================================

    print("\nAdmin approving leave request...")

    r = client.patch(
        f"/api/v1/leaves/{leave_id}/approve",
        json={"review_comment": "Approved by management."},
        headers=headers,
    )

    assert r.status_code == 200, f"Approve leave failed: {r.status_code} {r.text}"
    approved_leave = r.json()
    assert approved_leave["status"] == "APPROVED", "Leave status mismatch."
    assert approved_leave["reviewed_by_id"] is not None, "reviewed_by_id not recorded."
    assert approved_leave["reviewed_at"] is not None, "reviewed_at not recorded."
    print("Approve leave request OK! Reviewer metadata verified.")


    # ========================================================
    # 24. Attendance Check-In
    # ========================================================

    print("\nTesting employee attendance check-in...")

    r = client.post(
        "/api/v1/attendance/check-in",
        headers=emp_headers,
    )

    assert r.status_code == 201, f"Attendance check-in failed: {r.status_code} {r.text}"
    att_data = r.json()
    assert att_data["status"] == "PRESENT", "Attendance status mismatch."
    assert att_data["check_in"] is not None, "check_in not recorded."
    att_id = att_data["id"]
    print("Attendance check-in OK!")


    # ========================================================
    # 25. Verify Duplicate Check-In is Rejected
    # ========================================================

    print("\nVerifying duplicate check-in is rejected...")

    r = client.post(
        "/api/v1/attendance/check-in",
        headers=emp_headers,
    )

    assert r.status_code == 409, f"Duplicate check-in was not rejected with 409: {r.status_code}"
    print("Duplicate check-in rejected OK!")


    # ========================================================
    # 26. Attendance Check-Out & Verify Working Minutes
    # ========================================================

    print("\nTesting employee attendance check-out...")

    r = client.patch(
        "/api/v1/attendance/check-out",
        headers=emp_headers,
    )

    assert r.status_code == 200, f"Attendance check-out failed: {r.status_code} {r.text}"
    att_out_data = r.json()
    assert att_out_data["check_out"] is not None, "check_out not recorded."
    assert att_out_data["working_minutes"] >= 0, "working_minutes calculation invalid."
    print("Attendance check-out OK! Working minutes calculated.")


    # ========================================================
    # 27. Attendance Listing & History
    # ========================================================

    print("\nListing attendance and fetching summary...")

    r_att_list = client.get("/api/v1/attendance", headers=headers)
    assert r_att_list.status_code == 200, f"List attendance failed: {r_att_list.status_code}"
    assert r_att_list.json()["total"] >= 1, "Attendance list empty."

    r_att_me = client.get("/api/v1/attendance/me", headers=emp_headers)
    assert r_att_me.status_code == 200, f"Get attendance history failed: {r_att_me.status_code}"
    assert r_att_me.json()["total"] >= 1, "Attendance history empty."

    r_att_sum = client.get("/api/v1/attendance/summary/me", headers=emp_headers)
    assert r_att_sum.status_code == 200, f"Get attendance summary failed: {r_att_sum.status_code}"
    assert "total_days" in r_att_sum.json(), "Summary total_days missing."
    print("Attendance listing, history, and summary OK!")


    # ========================================================
    # 28. Verify Week 4 In-App Notifications
    # ========================================================

    print("\nVerifying Week 4 notifications generation & lifecycle...")

    r_notif_unread = client.get("/api/v1/notifications/unread-count", headers=emp_headers)
    assert r_notif_unread.status_code == 200, f"Unread count failed: {r_notif_unread.text}"
    assert r_notif_unread.json()["count"] >= 1, "Expected at least 1 notification for employee."

    r_notif_list = client.get("/api/v1/notifications", headers=emp_headers)
    assert r_notif_list.status_code == 200, f"List notifications failed: {r_notif_list.text}"
    notifs = r_notif_list.json()["items"]
    assert len(notifs) >= 1, "Notifications list is empty."
    notif_id = notifs[0]["id"]

    # Mark single notification as read
    r_notif_read = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=emp_headers)
    assert r_notif_read.status_code == 200, f"Mark read failed: {r_notif_read.text}"
    assert r_notif_read.json()["is_read"] is True

    # Mark all as read
    r_notif_all = client.patch("/api/v1/notifications/read-all", headers=emp_headers)
    assert r_notif_all.status_code == 200, f"Mark all read failed: {r_notif_all.text}"

    r_notif_unread_after = client.get("/api/v1/notifications/unread-count", headers=emp_headers)
    assert r_notif_unread_after.json()["count"] == 0, "Unread count should be 0 after read-all."

    print("Notification generation, unread counts, and read lifecycle OK!")


    # ========================================================
    # 29. Verify Analytics Dashboard
    # ========================================================

    print("\nVerifying real-time analytics aggregation...")

    r_analytics_admin = client.get("/api/v1/dashboard/analytics", headers=headers)
    assert r_analytics_admin.status_code == 200, f"Admin analytics failed: {r_analytics_admin.text}"
    admin_data = r_analytics_admin.json()
    assert admin_data["role"] == "admin"
    assert admin_data["summary"]["total_projects"] >= 1
    assert "tasks" in admin_data
    assert "projects" in admin_data
    assert "departments" in admin_data

    r_analytics_emp = client.get("/api/v1/dashboard/analytics", headers=emp_headers)
    assert r_analytics_emp.status_code == 200, f"Employee analytics failed: {r_analytics_emp.text}"
    emp_data = r_analytics_emp.json()
    assert emp_data["role"] == "employee"
    assert emp_data["departments"] == []  # Employee should not receive organization department metrics

    print("Analytics calculations & role-scoping OK!")


    # ========================================================
    # 30. Verify Global Search
    # ========================================================

    print("\nVerifying unified global search...")

    r_search = client.get("/api/v1/search?q=OAuth", headers=headers)
    assert r_search.status_code == 200, f"Search failed: {r_search.text}"
    search_data = r_search.json()
    assert search_data["total"] >= 1, "Expected search matches for 'OAuth'"
    assert len(search_data["results"]["tasks"]) >= 1

    print("Global search categorized results OK!")


    # ========================================================
    # 31. Verify Profile & Password Change
    # ========================================================

    print("\nVerifying profile update and password change...")

    r_prof = client.get("/api/v1/profile/me", headers=emp_headers)
    assert r_prof.status_code == 200, f"Get profile failed: {r_prof.text}"

    r_prof_up = client.patch(
        "/api/v1/profile/me",
        json={"full_name": "E2E Regular Employee Updated"},
        headers=emp_headers,
    )
    assert r_prof_up.status_code == 200, f"Update profile failed: {r_prof_up.text}"
    assert r_prof_up.json()["full_name"] == "E2E Regular Employee Updated"

    # Change password
    r_chg_pass = client.patch(
        "/api/v1/profile/change-password",
        json={
            "current_password": "Password123",
            "new_password": "NewSecretPassword123!",
            "confirm_password": "NewSecretPassword123!",
        },
        headers=emp_headers,
    )
    assert r_chg_pass.status_code == 200, f"Change password failed: {r_chg_pass.text}"

    # Verify old password rejected
    r_old_login = client.post(
        "/api/v1/auth/login",
        data={"username": emp_email, "password": "Password123"},
    )
    assert r_old_login.status_code == 401, "Old password was not invalidated!"

    # Verify new password login succeeds
    r_new_login = client.post(
        "/api/v1/auth/login",
        data={"username": emp_email, "password": "NewSecretPassword123!"},
    )
    assert r_new_login.status_code == 200, "Login with new password failed!"
    emp_token = r_new_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    print("Profile management & secure password change OK!")


    # ========================================================
    # 32. Verify Excel Reports Export
    # ========================================================

    print("\nVerifying openpyxl Excel reports export...")

    r_rep_emp = client.get("/api/v1/reports/employees/export", headers=headers)
    assert r_rep_emp.status_code == 200, f"Export employees failed: {r_rep_emp.status_code}"
    assert "spreadsheetml" in r_rep_emp.headers["content-type"]

    r_rep_proj = client.get("/api/v1/reports/projects/export", headers=headers)
    assert r_rep_proj.status_code == 200, f"Export projects failed: {r_rep_proj.status_code}"

    r_rep_tasks = client.get("/api/v1/reports/tasks/export", headers=headers)
    assert r_rep_tasks.status_code == 200, f"Export tasks failed: {r_rep_tasks.status_code}"

    r_rep_att = client.get("/api/v1/reports/attendance/export", headers=headers)
    assert r_rep_att.status_code == 200, f"Export attendance failed: {r_rep_att.status_code}"

    print("Excel report generation (.xlsx) OK!")


    # ========================================================
    # 33. Verify Cross-Company Tenant Isolation (Week 1-4)
    # ========================================================

    print("\nVerifying multi-tenant isolation with Company B...")

    comp_b_email = f"tenant_b_{timestamp}@example.com"
    r_reg_b = client.post(
        "/api/v1/auth/register",
        json={
            "email": comp_b_email,
            "full_name": "Tenant B User",
            "password": "Password123",
            "company_name": f"Tenant B Corp {timestamp}",
        },
    )
    assert r_reg_b.status_code == 201, f"Tenant B registration failed: {r_reg_b.text}"

    r_login_b = client.post(
        "/api/v1/auth/login",
        data={"username": comp_b_email, "password": "Password123"},
    )
    assert r_login_b.status_code == 200, f"Tenant B login failed: {r_login_b.text}"
    token_b = r_login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Tenant B tries to access Tenant A's project -> must fail with 404
    r_iso_proj = client.get(f"/api/v1/projects/{project_id}", headers=headers_b)
    assert r_iso_proj.status_code == 404, f"Tenant isolation failed for project: {r_iso_proj.status_code}"

    # Tenant B tries to access Tenant A's task -> must fail with 404
    r_iso_task = client.get(f"/api/v1/tasks/{task_id}", headers=headers_b)
    assert r_iso_task.status_code == 404, f"Tenant isolation failed for task: {r_iso_task.status_code}"

    # Tenant B tries to access Tenant A's leave -> must fail with 404
    r_iso_leave = client.get(f"/api/v1/leaves/{leave_id}", headers=headers_b)
    assert r_iso_leave.status_code == 404, f"Tenant isolation failed for leave: {r_iso_leave.status_code}"

    # Tenant B tries to access Tenant A's attendance -> must fail with 404
    r_iso_att = client.get(f"/api/v1/attendance/{att_id}", headers=headers_b)
    assert r_iso_att.status_code == 404, f"Tenant isolation failed for attendance: {r_iso_att.status_code}"

    # Tenant B tries to mark Tenant A's notification -> must fail with 404
    r_iso_notif = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers_b)
    assert r_iso_notif.status_code == 404, f"Tenant isolation failed for notification: {r_iso_notif.status_code}"

    # Tenant B searches for Company A's task -> must return 0 results
    r_iso_search = client.get("/api/v1/search?q=OAuth", headers=headers_b)
    assert r_iso_search.status_code == 200
    assert r_iso_search.json()["total"] == 0

    print("Multi-tenant isolation verified OK for all modules (Projects, Tasks, Leaves, Attendance, Notifications, Search)!")


    # ========================================================
    # SUCCESS
    # ========================================================

    print("\n" + "=" * 60)
    print("E2E TEST PASSED SUCCESSFULLY!")
    print("=" * 60)

    print("\nVerified:")
    print("  [OK] Health check")
    print("  [OK] User registration")
    print("  [OK] Admin role assignment")
    print("  [OK] User login & JWT authentication")
    print("  [OK] Department creation & listing")
    print("  [OK] Employee listing & department assignment")
    print("  [OK] Employee detail retrieval")
    print("  [OK] Project creation & search/listing")
    print("  [OK] Task creation & listing")
    print("  [OK] Task assignment to employee")
    print("  [OK] Task status updates")
    print("  [OK] Task completion & completed_at lifecycle")
    print("  [OK] Task detail retrieval")
    print("  [OK] Leave request creation & listing")
    print("  [OK] Leave approval & reviewer tracking")
    print("  [OK] Employee attendance check-in")
    print("  [OK] Duplicate check-in rejection")
    print("  [OK] Attendance check-out & working_minutes calculation")
    print("  [OK] Attendance history and summary retrieval")
    print("  [OK] In-app notifications creation, unread count & read lifecycle")
    print("  [OK] Analytics dashboard real-time aggregation & role-scoping")
    print("  [OK] Global search categorized results")
    print("  [OK] Profile editing & password change security")
    print("  [OK] Excel reports (.xlsx) export")
    print("  [OK] Cross-company tenant isolation for all Week 1 - Week 4 modules")
    print("\nWeek 1, Week 2, Week 3, and Week 4 full-stack SaaS features are completely working!")



except Exception as e:

    print("\n" + "=" * 60)
    print("E2E TEST FAILED")
    print("=" * 60)

    print(f"\nError: {e}")

    raise


finally:

    print("\nStopping test server...")

    client.close()

    server_process.terminate()

    try:
        server_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server_process.kill()
        server_process.wait()

    print("Test server stopped.")