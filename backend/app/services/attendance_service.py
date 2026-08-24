import uuid
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import ConflictError, NotFoundError


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        self.attendance = AttendanceRepository(db)
        self.users = UserRepository(db)

    def check_in(self, company_id: uuid.UUID, employee_id: uuid.UUID) -> Attendance:
        emp = self.users.get_by_id_and_company(id=employee_id, company_id=company_id)
        if not emp:
            raise NotFoundError("Employee not found in your company.")
        if not emp.is_active:
            raise ConflictError("Inactive employees cannot check in.")

        now = datetime.now(timezone.utc)
        today = now.date()

        if self.attendance.get_by_employee_and_date(
            company_id=company_id, employee_id=employee_id, attendance_date=today
        ):
            raise ConflictError("You have already checked in for today.")

        # Calculate late arrival based on settings
        try:
            start_parts = settings.WORKDAY_START_TIME.split(":")
            start_h, start_m = int(start_parts[0]), int(start_parts[1])
        except (ValueError, IndexError):
            start_h, start_m = 9, 30

        workday_start_mins = start_h * 60 + start_m
        cutoff_mins = workday_start_mins + settings.LATE_GRACE_MINUTES
        check_in_mins = now.hour * 60 + now.minute

        if check_in_mins > cutoff_mins:
            is_late = True
            late_minutes = check_in_mins - workday_start_mins
        else:
            is_late = False
            late_minutes = 0

        attendance_record = Attendance(
            company_id=company_id,
            employee_id=employee_id,
            attendance_date=today,
            check_in=now,
            status=AttendanceStatus.PRESENT,
            is_late=is_late,
            late_minutes=late_minutes,
            working_minutes=0,
        )
        return self.attendance.create(attendance_record)

    def check_out(self, company_id: uuid.UUID, employee_id: uuid.UUID) -> Attendance:
        now = datetime.now(timezone.utc)
        today = now.date()

        record = self.attendance.get_by_employee_and_date(
            company_id=company_id, employee_id=employee_id, attendance_date=today
        )
        if not record:
            raise NotFoundError("No check-in record found for today. You must check in first.")

        if record.check_out is not None:
            raise ConflictError("You have already checked out for today.")

        record.check_out = now
        check_in_dt = record.check_in
        if check_in_dt.tzinfo is None:
            check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        total_seconds = (now - check_in_dt).total_seconds()
        record.working_minutes = max(0, int(total_seconds // 60))

        self.db.commit()
        self.db.refresh(record)
        return record

    def get(self, company_id: uuid.UUID, attendance_id: uuid.UUID) -> Attendance:
        record = self.attendance.get_by_id_and_company(id=attendance_id, company_id=company_id)
        if not record:
            raise NotFoundError("Attendance record not found.")
        return record

    def list(
        self,
        company_id: uuid.UUID,
        employee_id: uuid.UUID | None = None,
        department_id: uuid.UUID | None = None,
        status: AttendanceStatus | None = None,
        is_late: bool | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        sort_by: str = "attendance_date",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Attendance], int]:
        return self.attendance.search_and_list(
            company_id=company_id,
            employee_id=employee_id,
            department_id=department_id,
            status=status,
            is_late=is_late,
            start_date=start_date,
            end_date=end_date,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

    def get_summary(
        self, company_id: uuid.UUID, employee_id: uuid.UUID, month: int | None = None, year: int | None = None
    ) -> dict:
        return self.attendance.get_summary(company_id=company_id, employee_id=employee_id, month=month, year=year)
