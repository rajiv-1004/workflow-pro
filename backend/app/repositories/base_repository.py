"""
Generic repository providing the common CRUD operations so feature-specific
repositories only need to add queries that are actually specific to them.
"""
import uuid
from typing import Generic, Type, TypeVar

from sqlalchemy.orm import Session

from app.db.base_class import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> ModelType | None:
        return (
            self.db.query(self.model)
            .filter(self.model.id == id, self.model.is_deleted.is_(False))
            .first()
        )

    def list(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        return (
            self.db.query(self.model)
            .filter(self.model.is_deleted.is_(False))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelType) -> None:
        """Soft delete - never actually removes the row."""
        from datetime import datetime, timezone

        obj.is_deleted = True
        obj.deleted_at = datetime.now(timezone.utc)
        self.db.add(obj)
        self.db.commit()
