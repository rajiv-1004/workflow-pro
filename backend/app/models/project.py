import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.models.enums import ProjectStatus

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.department import Department
    from app.models.task import Task
    from app.models.user import User


class Project(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    """
    A project belonging to a company, optionally tied to a department and managed by a user.
    """
    __tablename__ = "projects"
    __table_args__ = (
        UniqueConstraint("company_id", "name", name="uix_company_project_name"),
    )

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=ProjectStatus.PLANNING,
        nullable=False,
        index=True,
    )
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    company_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    manager_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    company: Mapped["Company"] = relationship(back_populates="projects")
    department: Mapped["Department | None"] = relationship(back_populates="projects")
    manager: Mapped["User | None"] = relationship(foreign_keys=[manager_id], back_populates="managed_projects")
    tasks: Mapped[list["Task"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Project id={self.id} name={self.name!r} status={self.status}>"
