import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.notification import Notification
from app.repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session):
        super().__init__(Notification, db)

    def create_notification(
        self,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        type: NotificationType,
        title: str,
        message: str,
        resource_type: str | None = None,
        resource_id: uuid.UUID | None = None,
    ) -> Notification:
        notification = Notification(
            company_id=company_id,
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            resource_type=resource_type,
            resource_id=resource_id,
            is_read=False,
            read_at=None,
        )
        return self.create(notification)

    def list_for_user(
        self,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        is_read: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Notification], int]:
        query = self.db.query(Notification).filter(
            Notification.company_id == company_id,
            Notification.user_id == user_id,
            Notification.is_deleted.is_(False),
        )

        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)

        total = query.count()
        items = (
            query.order_by(desc(Notification.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def get_unread_count(self, company_id: uuid.UUID, user_id: uuid.UUID) -> int:
        return (
            self.db.query(Notification)
            .filter(
                Notification.company_id == company_id,
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
                Notification.is_deleted.is_(False),
            )
            .count()
        )

    def get_by_id_scoped(
        self, company_id: uuid.UUID, user_id: uuid.UUID, notification_id: uuid.UUID
    ) -> Notification | None:
        return (
            self.db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.company_id == company_id,
                Notification.user_id == user_id,
                Notification.is_deleted.is_(False),
            )
            .first()
        )

    def mark_as_read(
        self, company_id: uuid.UUID, user_id: uuid.UUID, notification_id: uuid.UUID
    ) -> Notification | None:
        notification = self.get_by_id_scoped(company_id, user_id, notification_id)
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(notification)
        return notification

    def mark_all_as_read(self, company_id: uuid.UUID, user_id: uuid.UUID) -> int:
        now = datetime.now(timezone.utc)
        count = (
            self.db.query(Notification)
            .filter(
                Notification.company_id == company_id,
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
                Notification.is_deleted.is_(False),
            )
            .update(
                {Notification.is_read: True, Notification.read_at: now},
                synchronize_session=False,
            )
        )
        self.db.commit()
        return count
