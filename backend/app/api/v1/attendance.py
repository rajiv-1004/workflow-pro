import uuid
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import RequireRole, get_current_active_user
from app.db.session import get_db
from app.models.enums import AttendanceStatus
from app.models.user import User
from app.schemas.attendance import (
    AttendanceResponse,
    AttendanceSummaryResponse,
    PaginatedAttendanceResponse,
)
from app.services.attendance_service import AttendanceService
from app.utils.exceptions import ForbiddenError

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AttendanceService(db)
    return service.check_in(company_id=current_user.company_id, employee_id=current_user.id)


@router.patch("/check-out", response_model=AttendanceResponse)
def check_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AttendanceService(db)
    return service.check_out(company_id=current_user.company_id, employee_id=current_user.id)


@router.get("/me", response_model=PaginatedAttendanceResponse)
def get_my_attendance(
    start_date: date | None = None,
    end_date: date | None = None,
    sort_by: Literal["attendance_date", "check_in", "check_out", "working_minutes", "status", "is_late", "late_minutes", "created_at"] = Query("attendance_date"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AttendanceService(db)
    items, total = service.list(
        company_id=current_user.company_id,
        employee_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return PaginatedAttendanceResponse(
        items=[AttendanceResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/summary/me", response_model=AttendanceSummaryResponse)
def get_my_summary(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AttendanceService(db)
    return service.get_summary(
        company_id=current_user.company_id,
        employee_id=current_user.id,
        month=month,
        year=year,
    )


@router.get("", response_model=PaginatedAttendanceResponse)
def list_attendance(
    employee_id: uuid.UUID | None = None,
    department_id: uuid.UUID | None = None,
    status: AttendanceStatus | None = None,
    is_late: bool | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    sort_by: Literal["attendance_date", "check_in", "check_out", "working_minutes", "status", "is_late", "late_minutes", "created_at"] = Query("attendance_date"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AttendanceService(db)

    # Employees can only query their own attendance
    target_employee_id = current_user.id if current_user.role.name == "employee" else employee_id

    items, total = service.list(
        company_id=current_user.company_id,
        employee_id=target_employee_id,
        department_id=department_id,
        status=status,
        is_late=is_late,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return PaginatedAttendanceResponse(
        items=[AttendanceResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(
    attendance_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AttendanceService(db)
    record = service.get(company_id=current_user.company_id, attendance_id=attendance_id)

    if current_user.role.name == "employee" and record.employee_id != current_user.id:
        raise ForbiddenError("You can only view your own attendance records.")

    return record
