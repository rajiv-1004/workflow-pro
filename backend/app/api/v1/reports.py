import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.enums import AttendanceStatus, ProjectStatus, TaskPriority, TaskStatus
from app.models.user import User
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

EXCEL_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/employees/export")
def export_employees(
    department_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ReportService(db)
    content = service.export_employees(current_user=current_user, department_id=department_id)
    return Response(
        content=content,
        media_type=EXCEL_MEDIA_TYPE,
        headers={"Content-Disposition": 'attachment; filename="employees_report.xlsx"'},
    )


@router.get("/projects/export")
def export_projects(
    status: ProjectStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ReportService(db)
    content = service.export_projects(current_user=current_user, status=status)
    return Response(
        content=content,
        media_type=EXCEL_MEDIA_TYPE,
        headers={"Content-Disposition": 'attachment; filename="projects_report.xlsx"'},
    )


@router.get("/tasks/export")
def export_tasks(
    project_id: uuid.UUID | None = None,
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ReportService(db)
    content = service.export_tasks(
        current_user=current_user,
        project_id=project_id,
        status=status,
        priority=priority,
    )
    return Response(
        content=content,
        media_type=EXCEL_MEDIA_TYPE,
        headers={"Content-Disposition": 'attachment; filename="tasks_report.xlsx"'},
    )


@router.get("/attendance/export")
def export_attendance(
    employee_id: uuid.UUID | None = None,
    status: AttendanceStatus | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ReportService(db)
    content = service.export_attendance(
        current_user=current_user,
        employee_id=employee_id,
        status=status,
        start_date=start_date,
        end_date=end_date,
    )
    return Response(
        content=content,
        media_type=EXCEL_MEDIA_TYPE,
        headers={"Content-Disposition": 'attachment; filename="attendance_report.xlsx"'},
    )
