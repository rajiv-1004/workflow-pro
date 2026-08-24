import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin
from app.models.enums import AttendanceStatus

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User


class Attendance(UUIDMixin, TimestampMixin, Base):
    """
    Daily attendance record for an employee. One record per employee per day per company.
    """
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("company_id", "employee_id", "attendance_date", name="uix_company_employee_date"),
    )

    attendance_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    check_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    working_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus, name="attendance_status", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=AttendanceStatus.PRESENT,
        nullable=False,
        index=True,
    )
    is_late: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    late_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    company_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    company: Mapped["Company"] = relationship(back_populates="attendance_records")
    employee: Mapped["User"] = relationship(back_populates="attendance_records")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Attendance id={self.id} employee_id={self.employee_id} date={self.attendance_date} status={self.status}>"
