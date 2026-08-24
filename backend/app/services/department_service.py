import uuid

from sqlalchemy.orm import Session

from app.models.department import Department
from app.repositories.department_repository import DepartmentRepository
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.utils.exceptions import ConflictError, NotFoundError


class DepartmentService:
    def __init__(self, db: Session):
        self.db = db
        self.departments = DepartmentRepository(db)

    def create(self, company_id: uuid.UUID, payload: DepartmentCreate) -> Department:
        # Check if department with same name exists in the company
        if self.departments.get_by_name(company_id=company_id, name=payload.name):
            raise ConflictError("A department with this name already exists in the company.")

        department = Department(
            name=payload.name,
            description=payload.description,
            company_id=company_id,
        )
        return self.departments.create(department)

    def list(
        self,
        company_id: uuid.UUID,
        search: str | None = None,
        is_active: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Department], int]:
        return self.departments.search_and_list(
            company_id=company_id,
            search=search,
            is_active=is_active,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

    def get(self, company_id: uuid.UUID, department_id: uuid.UUID) -> Department:
        department = self.departments.get_by_id_and_company(id=department_id, company_id=company_id)
        if not department:
            raise NotFoundError("Department not found.")
        return department

    def update(
        self, company_id: uuid.UUID, department_id: uuid.UUID, payload: DepartmentUpdate
    ) -> Department:
        department = self.get(company_id=company_id, department_id=department_id)

        if payload.name is not None and payload.name != department.name:
            if self.departments.get_by_name(company_id=company_id, name=payload.name):
                raise ConflictError("A department with this name already exists in the company.")
            department.name = payload.name

        if payload.description is not None:
            department.description = payload.description

        self.db.commit()
        self.db.refresh(department)
        return department

    def deactivate(self, company_id: uuid.UUID, department_id: uuid.UUID) -> Department:
        department = self.get(company_id=company_id, department_id=department_id)
        department.is_active = False
        self.db.commit()
        self.db.refresh(department)
        return department
