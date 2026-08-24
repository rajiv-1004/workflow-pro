import uuid

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.models.enums import TaskPriority, TaskStatus
from app.models.task import Task
from app.repositories.base_repository import BaseRepository

ALLOWED_TASK_SORT_FIELDS = {
    "title": Task.title,
    "status": Task.status,
    "priority": Task.priority,
    "due_date": Task.due_date,
    "completed_at": Task.completed_at,
    "created_at": Task.created_at,
    "updated_at": Task.updated_at,
}


class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: Session):
        super().__init__(Task, db)

    def get_by_id_and_company(self, id: uuid.UUID, company_id: uuid.UUID) -> Task | None:
        return (
            self.db.query(self.model)
            .filter(
                self.model.id == id,
                self.model.company_id == company_id,
                self.model.is_deleted.is_(False),
            )
            .first()
        )

    def search_and_list(
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
        query = self.db.query(self.model).filter(
            self.model.company_id == company_id,
            self.model.is_deleted.is_(False),
        )

        if search:
            query = query.filter(
                or_(
                    self.model.title.ilike(f"%{search}%"),
                    self.model.description.ilike(f"%{search}%"),
                )
            )

        if project_id is not None:
            query = query.filter(self.model.project_id == project_id)

        if assigned_to_id is not None:
            query = query.filter(self.model.assigned_to_id == assigned_to_id)

        if status is not None:
            query = query.filter(self.model.status == status)

        if priority is not None:
            query = query.filter(self.model.priority == priority)

        if is_active is not None:
            query = query.filter(self.model.is_active == is_active)

        total = query.count()

        sort_column = ALLOWED_TASK_SORT_FIELDS.get(sort_by, Task.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total
