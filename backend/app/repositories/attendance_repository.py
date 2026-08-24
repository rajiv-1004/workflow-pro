import uuid
from datetime import date

from sqlalchemy import asc, desc, extract
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus
from app.models.user import User
from app.repositories.base_repository import BaseRepository

ALLOWED_ATTENDANCE_SORT_FIELDS = {
    "attendance_date": Attendance.attendance_date,
    "check_in": Attendance.check_in,
    "check_out": Attendance.check_out,
    "working_minutes": Attendance.working_minutes,
    "status": Attendance.status,
    "is_late": Attendance.is_late,
    "late_minutes": Attendance.late_minutes,
    "created_at": Attendance.created_at,
}


class AttendanceRepository(BaseRepository[Attendance]):
    def __init__(self, db: Session):
        super().__init__(Attendance, db)

    def get_by_id_and_company(self, id: uuid.UUID, company_id: uuid.UUID) -> Attendance | None:
        return (
            self.db.query(Attendance)
            .filter(
                Attendance.id == id,
                Attendance.company_id == company_id,
            )
            .first()
        )

    def get_by_employee_and_date(
        self, company_id: uuid.UUID, employee_id: uuid.UUID, attendance_date: date
    ) -> Attendance | None:
        return (
            self.db.query(Attendance)
            .filter(
                Attendance.company_id == company_id,
                Attendance.employee_id == employee_id,
                Attendance.attendance_date == attendance_date,
            )
            .first()
        )

    def search_and_list(
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
        query = self.db.query(Attendance).filter(
            Attendance.company_id == company_id,
        )

        if employee_id is not None:
            query = query.filter(Attendance.employee_id == employee_id)

        if department_id is not None:
            query = query.join(User, Attendance.employee_id == User.id).filter(
                User.department_id == department_id
            )

        if status is not None:
            query = query.filter(Attendance.status == status)

        if is_late is not None:
            query = query.filter(Attendance.is_late == is_late)

        if start_date is not None:
            query = query.filter(Attendance.attendance_date >= start_date)

        if end_date is not None:
            query = query.filter(Attendance.attendance_date <= end_date)

        total = query.count()

        sort_column = ALLOWED_ATTENDANCE_SORT_FIELDS.get(sort_by, Attendance.attendance_date)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_summary(
        self, company_id: uuid.UUID, employee_id: uuid.UUID, month: int | None = None, year: int | None = None
    ) -> dict:
        query = self.db.query(Attendance).filter(
            Attendance.company_id == company_id,
            Attendance.employee_id == employee_id,
        )
        if month is not None:
            query = query.filter(extract("month", Attendance.attendance_date) == month)
        if year is not None:
            query = query.filter(extract("year", Attendance.attendance_date) == year)

        records = query.all()
        total_days = len(records)
        present_days = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        late_days = sum(1 for r in records if r.is_late)
        total_working_minutes = sum(r.working_minutes for r in records)
        average_working_minutes = (
            round(total_working_minutes / total_days, 2) if total_days > 0 else 0.0
        )

        return {
            "total_days": total_days,
            "present_days": present_days,
            "late_days": late_days,
            "total_working_minutes": total_working_minutes,
            "average_working_minutes": average_working_minutes,
        }
