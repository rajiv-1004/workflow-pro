"""
Import every model here so `Base.metadata` is fully populated wherever
`app.db.base_class.Base` is imported - this is what Alembic's env.py
relies on for autogenerate to see all tables.
"""
from app.models.attendance import Attendance  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.enums import (  # noqa: F401
    AttendanceStatus,
    LeaveStatus,
    LeaveType,
    NotificationType,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)
from app.models.leave import LeaveRequest  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.role import Role  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.user import User  # noqa: F401

