import uuid

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> User | None:
        return (
            self.db.query(User)
            .filter(User.email == email.lower(), User.is_deleted.is_(False))
            .first()
        )

    def email_exists(self, email: str) -> bool:
        return self.get_by_email(email) is not None

    def get_by_id_and_company(self, id: uuid.UUID, company_id: uuid.UUID) -> User | None:
        return (
            self.db.query(User)
            .filter(
                User.id == id,
                User.company_id == company_id,
                User.is_deleted.is_(False),
            )
            .first()
        )

    def search_and_list(
        self,
        company_id: uuid.UUID,
        search: str | None = None,
        department_id: uuid.UUID | None = None,
        is_active: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[User], int]:
        query = self.db.query(User).filter(
            User.company_id == company_id,
            User.is_deleted.is_(False),
        )

        if search:
            query = query.filter(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                )
            )

        if department_id is not None:
            query = query.filter(User.department_id == department_id)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        total = query.count()

        # sorting
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total
