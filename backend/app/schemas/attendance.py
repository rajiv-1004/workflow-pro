import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import AttendanceStatus


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    employee_id: uuid.UUID
    attendance_date: date
    check_in: datetime
    check_out: datetime | None
    working_minutes: int
    status: AttendanceStatus
    is_late: bool
    late_minutes: int
    created_at: datetime
    updated_at: datetime


class PaginatedAttendanceResponse(BaseModel):
    items: list[AttendanceResponse]
    page: int
    page_size: int
    total: int
    pages: int


class AttendanceSummaryResponse(BaseModel):
    total_days: int
    present_days: int
    late_days: int
    total_working_minutes: int
    average_working_minutes: float
