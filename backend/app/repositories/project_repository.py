import uuid

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.models.enums import ProjectStatus
from app.models.project import Project
from app.repositories.base_repository import BaseRepository

ALLOWED_PROJECT_SORT_FIELDS = {
    "name": Project.name,
    "status": Project.status,
    "start_date": Project.start_date,
    "due_date": Project.due_date,
    "created_at": Project.created_at,
    "updated_at": Project.updated_at,
}


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: Session):
        super().__init__(Project, db)

    def get_by_name(self, company_id: uuid.UUID, name: str) -> Project | None:
        return (
            self.db.query(self.model)
            .filter(
                self.model.company_id == company_id,
                self.model.name == name,
                self.model.is_deleted.is_(False),
            )
            .first()
        )

    def get_by_id_and_company(self, id: uuid.UUID, company_id: uuid.UUID) -> Project | None:
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
        status: ProjectStatus | None = None,
        department_id: uuid.UUID | None = None,
        manager_id: uuid.UUID | None = None,
        is_active: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Project], int]:
        query = self.db.query(self.model).filter(
            self.model.company_id == company_id,
            self.model.is_deleted.is_(False),
        )

        if search:
            query = query.filter(
                or_(
                    self.model.name.ilike(f"%{search}%"),
                    self.model.description.ilike(f"%{search}%"),
                )
            )

        if status is not None:
            query = query.filter(self.model.status == status)

        if department_id is not None:
            query = query.filter(self.model.department_id == department_id)

        if manager_id is not None:
            query = query.filter(self.model.manager_id == manager_id)

        if is_active is not None:
            query = query.filter(self.model.is_active == is_active)

        total = query.count()

        sort_column = ALLOWED_PROJECT_SORT_FIELDS.get(sort_by, Project.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total
