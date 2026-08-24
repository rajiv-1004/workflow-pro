import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.company import Company
    from app.models.department import Department
    from app.models.leave import LeaveRequest
    from app.models.notification import Notification
    from app.models.project import Project
    from app.models.role import Role
    from app.models.task import Task


class User(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    company_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    company: Mapped["Company"] = relationship(back_populates="users")
    department: Mapped["Department"] = relationship(back_populates="users")
    role: Mapped["Role"] = relationship(back_populates="users")
    managed_projects: Mapped[list["Project"]] = relationship(back_populates="manager", foreign_keys="Project.manager_id")
    assigned_tasks: Mapped[list["Task"]] = relationship(back_populates="assigned_to", foreign_keys="Task.assigned_to_id")
    created_tasks: Mapped[list["Task"]] = relationship(back_populates="created_by", foreign_keys="Task.created_by_id")
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(back_populates="employee", foreign_keys="LeaveRequest.employee_id")
    reviewed_leaves: Mapped[list["LeaveRequest"]] = relationship(back_populates="reviewed_by", foreign_keys="LeaveRequest.reviewed_by_id")
    attendance_records: Mapped[list["Attendance"]] = relationship(back_populates="employee")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")


    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} email={self.email!r}>"
