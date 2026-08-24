import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    resource_type: str | None
    resource_id: uuid.UUID | None
    is_read: bool
    read_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PaginatedNotificationResponse(BaseModel):
    items: list[NotificationResponse]
    page: int
    page_size: int
    total: int
    pages: int


class UnreadCountResponse(BaseModel):
    count: int
