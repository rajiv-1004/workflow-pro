from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.department import Department
    from app.models.leave import LeaveRequest
    from app.models.project import Project
    from app.models.task import Task
    from app.models.user import User


class Company(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    """
    A tenant/organization. Every User belongs to exactly one Company -
    this is the foundation for multi-tenancy used in later phases
    (Department, Project, Task all scope to a company).
    """
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)

    users: Mapped[list["User"]] = relationship(back_populates="company")
    departments: Mapped[list["Department"]] = relationship(back_populates="company")
    projects: Mapped[list["Project"]] = relationship(back_populates="company")
    tasks: Mapped[list["Task"]] = relationship(back_populates="company")
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(back_populates="company")
    attendance_records: Mapped[list["Attendance"]] = relationship(back_populates="company")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Company id={self.id} name={self.name!r}>"
