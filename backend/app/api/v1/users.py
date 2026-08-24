from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_active_user)) -> UserResponse:
    """Return the profile of the currently authenticated user. Requires a bearer token."""
    return UserResponse.model_validate(current_user)
