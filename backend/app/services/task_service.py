import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.enums import NotificationType, TaskPriority, TaskStatus
from app.models.task import Task
from app.repositories.notification_repository import NotificationRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.task import TaskCreate, TaskUpdate
from app.utils.exceptions import ConflictError, NotFoundError


class TaskService:
    def __init__(self, db: Session):
        self.db = db
        self.tasks = TaskRepository(db)
        self.projects = ProjectRepository(db)
        self.users = UserRepository(db)
        self.notifications = NotificationRepository(db)

    def create(self, company_id: uuid.UUID, created_by_id: uuid.UUID, payload: TaskCreate) -> Task:
        project = self.projects.get_by_id_and_company(id=payload.project_id, company_id=company_id)
        if not project:
            raise NotFoundError("Project not found in your company.")
        if not project.is_active:
            raise ConflictError("Cannot create tasks for an inactive project.")

        if payload.assigned_to_id is not None:
            assigned_user = self.users.get_by_id_and_company(id=payload.assigned_to_id, company_id=company_id)
            if not assigned_user:
                raise NotFoundError("Assigned employee not found in your company.")
            if not assigned_user.is_active:
                raise ConflictError("Cannot assign task to an inactive employee.")

        completed_at = (
            datetime.now(timezone.utc) if payload.status == TaskStatus.COMPLETED else None
        )

        task = Task(
            title=payload.title,
            description=payload.description,
            status=payload.status,
            priority=payload.priority,
            due_date=payload.due_date,
            completed_at=completed_at,
            project_id=payload.project_id,
            company_id=company_id,
            assigned_to_id=payload.assigned_to_id,
            created_by_id=created_by_id,
        )
        created_task = self.tasks.create(task)

        if payload.assigned_to_id is not None:
            self.notifications.create_notification(
                company_id=company_id,
                user_id=payload.assigned_to_id,
                type=NotificationType.TASK_ASSIGNED,
                title="New Task Assigned",
                message=f"You have been assigned to task: '{created_task.title}'",
                resource_type="task",
                resource_id=created_task.id,
            )

        return created_task

    def get(self, company_id: uuid.UUID, task_id: uuid.UUID) -> Task:
        task = self.tasks.get_by_id_and_company(id=task_id, company_id=company_id)
        if not task:
            raise NotFoundError("Task not found.")
        return task

    def list(
        self,
        company_id: uuid.UUID,
        search: str | None = None,
        project_id: uuid.UUID | None = None,
        assigned_to_id: uuid.UUID | None = None,
        status: TaskStatus | None = None,
        priority: TaskPriority | None = None,
        is_active: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Task], int]:
        return self.tasks.search_and_list(
            company_id=company_id,
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

    def update(self, company_id: uuid.UUID, task_id: uuid.UUID, payload: TaskUpdate) -> Task:
        task = self.get(company_id=company_id, task_id=task_id)

        if not task.is_active:
            raise ConflictError("Cannot update an inactive task.")

        if payload.project_id is not None and payload.project_id != task.project_id:
            project = self.projects.get_by_id_and_company(id=payload.project_id, company_id=company_id)
            if not project:
                raise NotFoundError("Project not found in your company.")
            if not project.is_active:
                raise ConflictError("Cannot move task to an inactive project.")
            task.project_id = payload.project_id

        if payload.assigned_to_id is not None:
            assigned_user = self.users.get_by_id_and_company(id=payload.assigned_to_id, company_id=company_id)
            if not assigned_user:
                raise NotFoundError("Assigned employee not found in your company.")
            if not assigned_user.is_active:
                raise ConflictError("Cannot assign task to an inactive employee.")
            task.assigned_to_id = payload.assigned_to_id

        if payload.title is not None:
            task.title = payload.title

        if payload.description is not None:
            task.description = payload.description

        if payload.priority is not None:
            task.priority = payload.priority

        if payload.due_date is not None:
            task.due_date = payload.due_date

        if payload.status is not None:
            if payload.status == TaskStatus.COMPLETED and task.status != TaskStatus.COMPLETED:
                task.completed_at = datetime.now(timezone.utc)
            elif payload.status != TaskStatus.COMPLETED and task.status == TaskStatus.COMPLETED:
                task.completed_at = None
            task.status = payload.status

        self.db.commit()
        self.db.refresh(task)
        return task

    def update_status(
        self, company_id: uuid.UUID, task_id: uuid.UUID, status: TaskStatus
    ) -> Task:
        task = self.get(company_id=company_id, task_id=task_id)
        if not task.is_active:
            raise ConflictError("Cannot update status of an inactive task.")

        if status == TaskStatus.COMPLETED and task.status != TaskStatus.COMPLETED:
            task.completed_at = datetime.now(timezone.utc)
        elif status != TaskStatus.COMPLETED and task.status == TaskStatus.COMPLETED:
            task.completed_at = None

        task.status = status
        self.db.commit()
        self.db.refresh(task)
        return task

    def assign(
        self, company_id: uuid.UUID, task_id: uuid.UUID, assigned_to_id: uuid.UUID | None
    ) -> Task:
        task = self.get(company_id=company_id, task_id=task_id)
        if not task.is_active:
            raise ConflictError("Cannot assign an inactive task.")

        project = self.projects.get_by_id_and_company(id=task.project_id, company_id=company_id)
        if not project or not project.is_active:
            raise ConflictError("Cannot assign tasks for an inactive project.")

        if assigned_to_id is not None:
            assigned_user = self.users.get_by_id_and_company(id=assigned_to_id, company_id=company_id)
            if not assigned_user:
                raise NotFoundError("Employee not found in your company.")
            if not assigned_user.is_active:
                raise ConflictError("Cannot assign task to an inactive employee.")

        task.assigned_to_id = assigned_to_id
        self.db.commit()
        self.db.refresh(task)

        if assigned_to_id is not None:
            self.notifications.create_notification(
                company_id=company_id,
                user_id=assigned_to_id,
                type=NotificationType.TASK_ASSIGNED,
                title="New Task Assigned",
                message=f"You have been assigned to task: '{task.title}'",
                resource_type="task",
                resource_id=task.id,
            )

        return task

    def complete(self, company_id: uuid.UUID, task_id: uuid.UUID) -> Task:
        task = self.get(company_id=company_id, task_id=task_id)
        if not task.is_active:
            raise ConflictError("Cannot complete an inactive task.")

        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(task)
        return task

    def deactivate(self, company_id: uuid.UUID, task_id: uuid.UUID) -> Task:
        task = self.get(company_id=company_id, task_id=task_id)
        task.is_active = False
        self.db.commit()
        self.db.refresh(task)
        return task
