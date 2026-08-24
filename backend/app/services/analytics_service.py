import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.department import Department
from app.models.enums import AttendanceStatus, LeaveStatus, LeaveType, ProjectStatus, TaskStatus
from app.models.leave import LeaveRequest
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.analytics import (
    AttendanceAnalytics,
    DashboardAnalyticsResponse,
    DashboardSummary,
    DepartmentMetric,
    LeaveAnalytics,
    ProjectStatusDistribution,
    TaskStatusDistribution,
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_analytics(self, current_user: User) -> DashboardAnalyticsResponse:
        company_id = current_user.company_id
        user_role = current_user.role.name if current_user.role else "employee"

        # 1. Tasks Analytics
        task_query = self.db.query(Task.status, func.count(Task.id)).filter(
            Task.company_id == company_id,
            Task.is_deleted.is_(False),
        )
        if user_role == "employee":
            task_query = task_query.filter(Task.assigned_to_id == current_user.id)

        task_counts_raw = task_query.group_by(Task.status).all()
        task_map = {status: count for status, count in task_counts_raw}

        todo_c = task_map.get(TaskStatus.TODO, 0)
        in_prog_c = task_map.get(TaskStatus.IN_PROGRESS, 0)
        in_rev_c = task_map.get(TaskStatus.IN_REVIEW, 0)
        completed_c = task_map.get(TaskStatus.COMPLETED, 0)
        cancelled_c = task_map.get(TaskStatus.CANCELLED, 0)
        total_tasks = todo_c + in_prog_c + in_rev_c + completed_c + cancelled_c
        completion_rate = round((completed_c / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        tasks_dist = TaskStatusDistribution(
            todo=todo_c,
            in_progress=in_prog_c,
            in_review=in_rev_c,
            completed=completed_c,
            cancelled=cancelled_c,
            total=total_tasks,
            completion_rate=completion_rate,
        )

        # 2. Projects Analytics
        proj_counts_raw = (
            self.db.query(Project.status, func.count(Project.id))
            .filter(
                Project.company_id == company_id,
                Project.is_deleted.is_(False),
            )
            .group_by(Project.status)
            .all()
        )
        proj_map = {status: count for status, count in proj_counts_raw}
        plan_p = proj_map.get(ProjectStatus.PLANNING, 0)
        active_p = proj_map.get(ProjectStatus.ACTIVE, 0)
        hold_p = proj_map.get(ProjectStatus.ON_HOLD, 0)
        comp_p = proj_map.get(ProjectStatus.COMPLETED, 0)
        canc_p = proj_map.get(ProjectStatus.CANCELLED, 0)
        total_projs = plan_p + active_p + hold_p + comp_p + canc_p

        projects_dist = ProjectStatusDistribution(
            planning=plan_p,
            active=active_p,
            on_hold=hold_p,
            completed=comp_p,
            cancelled=canc_p,
            total=total_projs,
        )

        # 3. Department Analytics
        dept_metrics: list[DepartmentMetric] = []
        if user_role in ["admin", "manager"]:
            dept_counts_raw = (
                self.db.query(
                    Department.id,
                    Department.name,
                    func.count(User.id).label("emp_count"),
                )
                .outerjoin(
                    User,
                    (User.department_id == Department.id) & (User.is_deleted.is_(False)),
                )
                .filter(
                    Department.company_id == company_id,
                    Department.is_deleted.is_(False),
                )
                .group_by(Department.id, Department.name)
                .all()
            )
            for d_id, d_name, emp_c in dept_counts_raw:
                dept_metrics.append(
                    DepartmentMetric(id=d_id, name=d_name, employee_count=emp_c)
                )

        # 4. Attendance Analytics
        att_query = self.db.query(Attendance).filter(
            Attendance.company_id == company_id,
        )
        if user_role == "employee":
            att_query = att_query.filter(Attendance.employee_id == current_user.id)

        att_records = att_query.all()
        total_att = len(att_records)
        present_att = sum(1 for a in att_records if a.status == AttendanceStatus.PRESENT)
        late_att = sum(1 for a in att_records if a.is_late)
        total_working_mins = sum(a.working_minutes for a in att_records)
        avg_working_mins = (
            round(total_working_mins / total_att, 1) if total_att > 0 else 0.0
        )
        att_rate = round((present_att / total_att * 100), 1) if total_att > 0 else 0.0

        attendance_analytics = AttendanceAnalytics(
            total_records=total_att,
            present_count=present_att,
            late_count=late_att,
            average_working_minutes=avg_working_mins,
            attendance_rate=att_rate,
        )

        # 5. Leaves Analytics
        leave_query = self.db.query(LeaveRequest).filter(
            LeaveRequest.company_id == company_id,
            LeaveRequest.is_deleted.is_(False),
        )
        if user_role == "employee":
            leave_query = leave_query.filter(LeaveRequest.employee_id == current_user.id)

        leave_records = leave_query.all()
        pending_leaves = sum(1 for l in leave_records if l.status == LeaveStatus.PENDING)
        approved_leaves = sum(1 for l in leave_records if l.status == LeaveStatus.APPROVED)
        rejected_leaves = sum(1 for l in leave_records if l.status == LeaveStatus.REJECTED)
        cancelled_leaves = sum(1 for l in leave_records if l.status == LeaveStatus.CANCELLED)

        by_type: dict[str, int] = {t.value: 0 for t in LeaveType}
        for l in leave_records:
            t_val = l.leave_type.value if hasattr(l.leave_type, "value") else str(l.leave_type)
            by_type[t_val] = by_type.get(t_val, 0) + 1

        leave_analytics = LeaveAnalytics(
            pending_count=pending_leaves,
            approved_count=approved_leaves,
            rejected_count=rejected_leaves,
            cancelled_count=cancelled_leaves,
            by_type=by_type,
        )

        # 6. Summary Overview
        total_emp = (
            self.db.query(User)
            .filter(User.company_id == company_id, User.is_deleted.is_(False))
            .count()
        )
        active_emp = (
            self.db.query(User)
            .filter(
                User.company_id == company_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            )
            .count()
        )
        total_dept = (
            self.db.query(Department)
            .filter(Department.company_id == company_id, Department.is_deleted.is_(False))
            .count()
        )

        summary = DashboardSummary(
            total_employees=total_emp if user_role in ["admin", "manager"] else 1,
            active_employees=active_emp if user_role in ["admin", "manager"] else 1,
            total_departments=total_dept,
            total_projects=total_projs,
            active_projects=active_p,
            total_tasks=total_tasks,
            open_tasks=todo_c + in_prog_c + in_rev_c,
            completed_tasks=completed_c,
            pending_leaves=pending_leaves,
        )

        return DashboardAnalyticsResponse(
            role=user_role,
            summary=summary,
            tasks=tasks_dist,
            projects=projects_dist,
            departments=dept_metrics,
            attendance=attendance_analytics,
            leaves=leave_analytics,
        )
