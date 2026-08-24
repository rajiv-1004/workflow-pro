import uuid

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.models.department import Department
from app.repositories.base_repository import BaseRepository


class DepartmentRepository(BaseRepository[Department]):
    def __init__(self, db: Session):
        super().__init__(Department, db)

    def get_by_name(self, company_id: uuid.UUID, name: str) -> Department | None:
        return (
            self.db.query(self.model)
            .filter(
                self.model.company_id == company_id,
                self.model.name == name,
                self.model.is_deleted.is_(False),
            )
            .first()
        )

    def get_by_id_and_company(self, id: uuid.UUID, company_id: uuid.UUID) -> Department | None:
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
        is_active: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Department], int]:
        query = self.db.query(self.model).filter(
            self.model.company_id == company_id,
            self.model.is_deleted.is_(False),
        )

        if search:
            query = query.filter(self.model.name.ilike(f"%{search}%"))

        if is_active is not None:
            query = query.filter(self.model.is_active == is_active)

        total = query.count()

        # sorting
        sort_column = getattr(self.model, sort_by, self.model.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total
