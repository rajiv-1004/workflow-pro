import uuid
from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ProjectStatus


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str | None = Field(None, max_length=500)
    department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None
    status: ProjectStatus = ProjectStatus.PLANNING
    start_date: datetime | None = None
    due_date: datetime | None = None

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        if self.start_date is not None and self.due_date is not None:
            if self.due_date < self.start_date:
                raise ValueError("due_date cannot be earlier than start_date.")
        return self


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=150)
    description: str | None = Field(None, max_length=500)
    department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None
    status: ProjectStatus | None = None
    start_date: datetime | None = None
    due_date: datetime | None = None

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        if self.start_date is not None and self.due_date is not None:
            if self.due_date < self.start_date:
                raise ValueError("due_date cannot be earlier than start_date.")
        return self


class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PaginatedProjectResponse(BaseModel):
    items: list[ProjectResponse]
    page: int
    page_size: int
    total: int
    pages: int
