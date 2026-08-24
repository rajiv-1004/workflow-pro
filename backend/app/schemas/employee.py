import uuid

from pydantic import BaseModel

from app.schemas.department import DepartmentResponse
from app.schemas.user import UserResponse


class EmployeeResponse(UserResponse):
    """
    Extends UserResponse to optionally include nested department details
    or just the department_id.
    """
    department_id: uuid.UUID | None = None
    department: DepartmentResponse | None = None


class EmployeeUpdate(BaseModel):
    """
    Schema for updating an employee's basic info (not including department/role changes).
    """
    full_name: str | None = None
    # We could add more fields here if needed


class DepartmentAssignment(BaseModel):
    department_id: uuid.UUID | None = None


class PaginatedEmployeeResponse(BaseModel):
    items: list[EmployeeResponse]
    page: int
    page_size: int
    total: int
    pages: int
