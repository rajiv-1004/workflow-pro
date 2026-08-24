import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import RequireRole, get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    PaginatedDepartmentResponse,
)
from app.services.department_service import DepartmentService

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    service = DepartmentService(db)
    return service.create(company_id=current_user.company_id, payload=payload)


@router.get("", response_model=PaginatedDepartmentResponse)
def list_departments(
    search: str | None = None,
    is_active: bool | None = None,
    sort_by: Literal["name", "created_at"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager", "employee"])),
):
    service = DepartmentService(db)
    items, total = service.list(
        company_id=current_user.company_id,
        search=search,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return PaginatedDepartmentResponse(
        items=[DepartmentResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager", "employee"])),
):
    service = DepartmentService(db)
    return service.get(company_id=current_user.company_id, department_id=department_id)


@router.patch("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: uuid.UUID,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    service = DepartmentService(db)
    return service.update(
        company_id=current_user.company_id, department_id=department_id, payload=payload
    )


@router.delete("/{department_id}", response_model=DepartmentResponse)
def deactivate_department(
    department_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    service = DepartmentService(db)
    return service.deactivate(company_id=current_user.company_id, department_id=department_id)
