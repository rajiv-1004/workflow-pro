import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.models.enums import LeaveStatus, LeaveType

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User


class LeaveRequest(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    """
    An employee's leave request scoped to their company.
    """
    __tablename__ = "leave_requests"

    leave_type: Mapped[LeaveType] = mapped_column(
        Enum(LeaveType, name="leave_type", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[LeaveStatus] = mapped_column(
        Enum(LeaveStatus, name="leave_status", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=LeaveStatus.PENDING,
        nullable=False,
        index=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    company_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    company: Mapped["Company"] = relationship(back_populates="leave_requests")
    employee: Mapped["User"] = relationship(foreign_keys=[employee_id], back_populates="leave_requests")
    reviewed_by: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by_id], back_populates="reviewed_leaves")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<LeaveRequest id={self.id} employee_id={self.employee_id} status={self.status}>"
