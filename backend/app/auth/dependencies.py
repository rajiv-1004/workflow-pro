"""
FastAPI dependencies for protected routes.

Usage in a route:

    @router.get("/me")
    def read_me(current_user: User = Depends(get_current_user)):
        ...
"""
import uuid

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import InactiveUserError, NotAuthenticatedError

# tokenUrl only affects the Swagger "Authorize" UI - it points at the login route.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise NotAuthenticatedError()

    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise NotAuthenticatedError()

    try:
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, TypeError):
        raise NotAuthenticatedError()

    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise NotAuthenticatedError()

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise InactiveUserError()
    return current_user


class RequireRole:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role.name not in self.allowed_roles:
            from app.utils.exceptions import ForbiddenError
            raise ForbiddenError(f"Role '{current_user.role.name}' does not have permission for this action.")
        return current_user

