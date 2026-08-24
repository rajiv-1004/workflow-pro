import uuid
from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import LeaveStatus, LeaveType


class LeaveBase(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str | None = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_dates(self) -> Self:
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValueError("end_date cannot be earlier than start_date.")
        return self


class LeaveCreate(LeaveBase):
    pass


class LeaveUpdate(BaseModel):
    leave_type: LeaveType | None = None
    start_date: date | None = None
    end_date: date | None = None
    reason: str | None = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_dates(self) -> Self:
        if self.start_date is not None and self.end_date is not None:
            if self.end_date < self.start_date:
                raise ValueError("end_date cannot be earlier than start_date.")
        return self


class LeaveReview(BaseModel):
    review_comment: str | None = Field(None, max_length=500)


class LeaveResponse(LeaveBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    employee_id: uuid.UUID
    status: LeaveStatus
    reviewed_by_id: uuid.UUID | None
    reviewed_at: datetime | None
    review_comment: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PaginatedLeaveResponse(BaseModel):
    items: list[LeaveResponse]
    page: int
    page_size: int
    total: int
    pages: int
