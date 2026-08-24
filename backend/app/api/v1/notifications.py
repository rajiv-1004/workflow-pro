import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    PaginatedNotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=PaginatedNotificationResponse)
def list_notifications(
    is_read: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = NotificationService(db)
    items, total = service.list(
        company_id=current_user.company_id,
        user_id=current_user.id,
        is_read=is_read,
        page=page,
        page_size=page_size,
    )
    return PaginatedNotificationResponse(
        items=[NotificationResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = NotificationService(db)
    count = service.get_unread_count(
        company_id=current_user.company_id, user_id=current_user.id
    )
    return UnreadCountResponse(count=count)


@router.patch("/read-all", response_model=UnreadCountResponse)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = NotificationService(db)
    count = service.mark_all_as_read(
        company_id=current_user.company_id, user_id=current_user.id
    )
    return UnreadCountResponse(count=count)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = NotificationService(db)
    return service.mark_as_read(
        company_id=current_user.company_id,
        user_id=current_user.id,
        notification_id=notification_id,
    )
