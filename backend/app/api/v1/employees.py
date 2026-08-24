import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import RequireRole, get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.employee import (
    DepartmentAssignment,
    EmployeeResponse,
    EmployeeUpdate,
    PaginatedEmployeeResponse,
)
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=PaginatedEmployeeResponse)
def list_employees(
    search: str | None = None,
    department_id: uuid.UUID | None = None,
    is_active: bool | None = None,
    sort_by: Literal["full_name", "created_at"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = EmployeeService(db)
    items, total = service.list(
        company_id=current_user.company_id,
        search=search,
        department_id=department_id,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return PaginatedEmployeeResponse(
        items=[EmployeeResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Admin and managers can view anyone in company. Employees can only view themselves (or we can let them view others, but let's restrict to self or admin/manager)
    if current_user.role.name == "employee" and current_user.id != employee_id:
        from app.utils.exceptions import ForbiddenError
        raise ForbiddenError("You can only view your own profile.")

    service = EmployeeService(db)
    return service.get(company_id=current_user.company_id, employee_id=employee_id)


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    service = EmployeeService(db)
    return service.update(
        company_id=current_user.company_id, employee_id=employee_id, payload=payload
    )


@router.patch("/{employee_id}/department", response_model=EmployeeResponse)
def assign_department(
    employee_id: uuid.UUID,
    payload: DepartmentAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    service = EmployeeService(db)
    return service.assign_department(
        company_id=current_user.company_id,
        employee_id=employee_id,
        department_id=payload.department_id,
    )


@router.patch("/{employee_id}/deactivate", response_model=EmployeeResponse)
def deactivate_employee(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    service = EmployeeService(db)
    return service.deactivate(company_id=current_user.company_id, employee_id=employee_id)
