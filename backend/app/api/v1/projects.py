import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import RequireRole
from app.db.session import get_db
from app.models.enums import ProjectStatus
from app.models.user import User
from app.schemas.project import (
    PaginatedProjectResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectStatusUpdate,
    ProjectUpdate,
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = ProjectService(db)
    return service.create(company_id=current_user.company_id, payload=payload)


@router.get("", response_model=PaginatedProjectResponse)
def list_projects(
    search: str | None = None,
    status: ProjectStatus | None = None,
    department_id: uuid.UUID | None = None,
    manager_id: uuid.UUID | None = None,
    is_active: bool | None = None,
    sort_by: Literal["name", "status", "start_date", "due_date", "created_at", "updated_at"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager", "employee"])),
):
    service = ProjectService(db)
    items, total = service.list(
        company_id=current_user.company_id,
        search=search,
        status=status,
        department_id=department_id,
        manager_id=manager_id,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return PaginatedProjectResponse(
        items=[ProjectResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager", "employee"])),
):
    service = ProjectService(db)
    return service.get(company_id=current_user.company_id, project_id=project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = ProjectService(db)
    return service.update(
        company_id=current_user.company_id, project_id=project_id, payload=payload
    )


@router.patch("/{project_id}/status", response_model=ProjectResponse)
def update_project_status(
    project_id: uuid.UUID,
    payload: ProjectStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = ProjectService(db)
    return service.update_status(
        company_id=current_user.company_id, project_id=project_id, status=payload.status
    )


@router.patch("/{project_id}/deactivate", response_model=ProjectResponse)
def deactivate_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = ProjectService(db)
    return service.deactivate(company_id=current_user.company_id, project_id=project_id)
