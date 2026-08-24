import uuid
from pydantic import BaseModel


class TaskStatusDistribution(BaseModel):
    todo: int = 0
    in_progress: int = 0
    in_review: int = 0
    completed: int = 0
    cancelled: int = 0
    total: int = 0
    completion_rate: float = 0.0


class ProjectStatusDistribution(BaseModel):
    planning: int = 0
    active: int = 0
    on_hold: int = 0
    completed: int = 0
    cancelled: int = 0
    total: int = 0


class DepartmentMetric(BaseModel):
    id: uuid.UUID
    name: str
    employee_count: int = 0


class AttendanceAnalytics(BaseModel):
    total_records: int = 0
    present_count: int = 0
    late_count: int = 0
    average_working_minutes: float = 0.0
    attendance_rate: float = 0.0


class LeaveAnalytics(BaseModel):
    pending_count: int = 0
    approved_count: int = 0
    rejected_count: int = 0
    cancelled_count: int = 0
    by_type: dict[str, int] = {}


class DashboardSummary(BaseModel):
    total_employees: int = 0
    active_employees: int = 0
    total_departments: int = 0
    total_projects: int = 0
    active_projects: int = 0
    total_tasks: int = 0
    open_tasks: int = 0
    completed_tasks: int = 0
    pending_leaves: int = 0


class DashboardAnalyticsResponse(BaseModel):
    role: str
    summary: DashboardSummary
    tasks: TaskStatusDistribution
    projects: ProjectStatusDistribution
    departments: list[DepartmentMetric]
    attendance: AttendanceAnalytics
    leaves: LeaveAnalytics
