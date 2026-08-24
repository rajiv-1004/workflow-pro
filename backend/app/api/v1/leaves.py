import uuid
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import RequireRole, get_current_active_user
from app.db.session import get_db
from app.models.enums import LeaveStatus, LeaveType
from app.models.user import User
from app.schemas.leave import (
    LeaveCreate,
    LeaveResponse,
    LeaveReview,
    LeaveUpdate,
    PaginatedLeaveResponse,
)
from app.services.leave_service import LeaveService
from app.utils.exceptions import ForbiddenError

router = APIRouter(prefix="/leaves", tags=["Leaves"])


@router.post("", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def create_leave_request(
    payload: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = LeaveService(db)
    return service.create(
        company_id=current_user.company_id,
        employee_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=PaginatedLeaveResponse)
def list_leave_requests(
    employee_id: uuid.UUID | None = None,
    department_id: uuid.UUID | None = None,
    leave_type: LeaveType | None = None,
    status: LeaveStatus | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    sort_by: Literal["start_date", "end_date", "status", "leave_type", "created_at", "updated_at"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = LeaveService(db)

    # Employees can only view their own leave requests
    target_employee_id = current_user.id if current_user.role.name == "employee" else employee_id

    items, total = service.list(
        company_id=current_user.company_id,
        employee_id=target_employee_id,
        department_id=department_id,
        leave_type=leave_type,
        status=status,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return PaginatedLeaveResponse(
        items=[LeaveResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/{leave_id}", response_model=LeaveResponse)
def get_leave_request(
    leave_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = LeaveService(db)
    leave = service.get(company_id=current_user.company_id, leave_id=leave_id)

    if current_user.role.name == "employee" and leave.employee_id != current_user.id:
        raise ForbiddenError("You can only view your own leave requests.")

    return leave


@router.patch("/{leave_id}", response_model=LeaveResponse)
def update_leave_request(
    leave_id: uuid.UUID,
    payload: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = LeaveService(db)
    return service.update(
        company_id=current_user.company_id,
        employee_id=current_user.id,
        leave_id=leave_id,
        payload=payload,
    )


@router.patch("/{leave_id}/approve", response_model=LeaveResponse)
def approve_leave_request(
    leave_id: uuid.UUID,
    payload: LeaveReview | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = LeaveService(db)
    return service.approve(
        company_id=current_user.company_id,
        reviewer_id=current_user.id,
        leave_id=leave_id,
        payload=payload,
    )


@router.patch("/{leave_id}/reject", response_model=LeaveResponse)
def reject_leave_request(
    leave_id: uuid.UUID,
    payload: LeaveReview | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = LeaveService(db)
    return service.reject(
        company_id=current_user.company_id,
        reviewer_id=current_user.id,
        leave_id=leave_id,
        payload=payload,
    )


@router.patch("/{leave_id}/cancel", response_model=LeaveResponse)
def cancel_leave_request(
    leave_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = LeaveService(db)
    return service.cancel(
        company_id=current_user.company_id,
        employee_id=current_user.id,
        leave_id=leave_id,
    )
