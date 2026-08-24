import uuid

from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository
from app.utils.exceptions import NotFoundError


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.notifications = NotificationRepository(db)

    def list(
        self,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        is_read: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Notification], int]:
        return self.notifications.list_for_user(
            company_id=company_id,
            user_id=user_id,
            is_read=is_read,
            page=page,
            page_size=page_size,
        )

    def get_unread_count(self, company_id: uuid.UUID, user_id: uuid.UUID) -> int:
        return self.notifications.get_unread_count(company_id, user_id)

    def mark_as_read(
        self, company_id: uuid.UUID, user_id: uuid.UUID, notification_id: uuid.UUID
    ) -> Notification:
        notification = self.notifications.mark_as_read(company_id, user_id, notification_id)
        if not notification:
            raise NotFoundError("Notification not found.")
        return notification

    def mark_all_as_read(self, company_id: uuid.UUID, user_id: uuid.UUID) -> int:
        return self.notifications.mark_all_as_read(company_id, user_id)

    def create(
        self,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        type: NotificationType,
        title: str,
        message: str,
        resource_type: str | None = None,
        resource_id: uuid.UUID | None = None,
    ) -> Notification:
        return self.notifications.create_notification(
            company_id=company_id,
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            resource_type=resource_type,
            resource_id=resource_id,
        )
