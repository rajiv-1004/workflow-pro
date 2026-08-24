import uuid

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.department_repository import DepartmentRepository
from app.repositories.user_repository import UserRepository
from app.schemas.employee import EmployeeUpdate
from app.utils.exceptions import ConflictError, NotFoundError


class EmployeeService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.departments = DepartmentRepository(db)

    def get(self, company_id: uuid.UUID, employee_id: uuid.UUID) -> User:
        employee = self.users.get_by_id_and_company(id=employee_id, company_id=company_id)
        if not employee:
            raise NotFoundError("Employee not found in your company.")
        return employee

    def list(
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
        return self.users.search_and_list(
            company_id=company_id,
            search=search,
            department_id=department_id,
            is_active=is_active,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

    def update(self, company_id: uuid.UUID, employee_id: uuid.UUID, payload: EmployeeUpdate) -> User:
        employee = self.get(company_id=company_id, employee_id=employee_id)
        if payload.full_name is not None:
            employee.full_name = payload.full_name
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def assign_department(
        self, company_id: uuid.UUID, employee_id: uuid.UUID, department_id: uuid.UUID | None
    ) -> User:
        employee = self.get(company_id=company_id, employee_id=employee_id)

        if department_id is not None:
            department = self.departments.get_by_id_and_company(id=department_id, company_id=company_id)
            if not department:
                raise NotFoundError("Department not found in your company.")
            if not department.is_active:
                raise ConflictError("Cannot assign employee to an inactive department.")

        employee.department_id = department_id
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def deactivate(self, company_id: uuid.UUID, employee_id: uuid.UUID) -> User:
        employee = self.get(company_id=company_id, employee_id=employee_id)
        employee.is_active = False
        self.db.commit()
        self.db.refresh(employee)
        return employee
