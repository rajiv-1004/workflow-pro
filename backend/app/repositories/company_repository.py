from sqlalchemy.orm import Session

from app.models.company import Company
from app.repositories.base_repository import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    def __init__(self, db: Session):
        super().__init__(Company, db)

    def get_by_name(self, name: str) -> Company | None:
        return (
            self.db.query(Company)
            .filter(Company.name == name, Company.is_deleted.is_(False))
            .first()
        )

    def get_or_create(self, name: str) -> Company:
        company = self.get_by_name(name)
        if company:
            return company
        return self.create(Company(name=name))
