import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import RequireRole, get_current_active_user
from app.db.session import get_db
from app.models.enums import TaskPriority, TaskStatus
from app.models.user import User
from app.schemas.task import (
    PaginatedTaskResponse,
    TaskAssignment,
    TaskCreate,
    TaskResponse,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.services.task_service import TaskService
from app.utils.exceptions import ForbiddenError

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = TaskService(db)
    return service.create(
        company_id=current_user.company_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=PaginatedTaskResponse)
def list_tasks(
    search: str | None = None,
    project_id: uuid.UUID | None = None,
    assigned_to_id: uuid.UUID | None = None,
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    is_active: bool | None = None,
    sort_by: Literal["title", "status", "priority", "due_date", "completed_at", "created_at", "updated_at"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager", "employee"])),
):
    service = TaskService(db)
    items, total = service.list(
        company_id=current_user.company_id,
        search=search,
        project_id=project_id,
        assigned_to_id=assigned_to_id,
        status=status,
        priority=priority,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return PaginatedTaskResponse(
        items=[TaskResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager", "employee"])),
):
    service = TaskService(db)
    return service.get(company_id=current_user.company_id, task_id=task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = TaskService(db)
    task = service.get(company_id=current_user.company_id, task_id=task_id)

    if current_user.role.name == "employee":
        if task.assigned_to_id != current_user.id:
            raise ForbiddenError("You can only modify tasks assigned to you.")
        # Employees cannot reassign or change project
        if payload.assigned_to_id is not None or payload.project_id is not None:
            raise ForbiddenError("Employees cannot reassign tasks or change projects.")

    return service.update(
        company_id=current_user.company_id, task_id=task_id, payload=payload
    )


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: uuid.UUID,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = TaskService(db)
    task = service.get(company_id=current_user.company_id, task_id=task_id)

    if current_user.role.name == "employee" and task.assigned_to_id != current_user.id:
        raise ForbiddenError("You can only update the status of tasks assigned to you.")

    return service.update_status(
        company_id=current_user.company_id, task_id=task_id, status=payload.status
    )


@router.patch("/{task_id}/assign", response_model=TaskResponse)
def assign_task(
    task_id: uuid.UUID,
    payload: TaskAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = TaskService(db)
    return service.assign(
        company_id=current_user.company_id,
        task_id=task_id,
        assigned_to_id=payload.assigned_to_id,
    )


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = TaskService(db)
    task = service.get(company_id=current_user.company_id, task_id=task_id)

    if current_user.role.name == "employee" and task.assigned_to_id != current_user.id:
        raise ForbiddenError("You can only complete tasks assigned to you.")

    return service.complete(company_id=current_user.company_id, task_id=task_id)


@router.patch("/{task_id}/deactivate", response_model=TaskResponse)
def deactivate_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "manager"])),
):
    service = TaskService(db)
    return service.deactivate(company_id=current_user.company_id, task_id=task_id)
