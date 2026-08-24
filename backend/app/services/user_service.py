import uuid

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import UserNotFoundError


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def get_by_id(self, user_id: uuid.UUID) -> User:
        user = self.users.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        return user
