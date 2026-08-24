from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserResponse:
    """Create a new user (and its company, if it doesn't exist yet)."""
    service = AuthService(db)
    user = service.register(payload)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    """
    OAuth2-compatible login. Uses the standard `username`/`password` form
    fields (username holds the email) so it plugs directly into Swagger's
    "Authorize" button and any standard OAuth2 client.
    """
    service = AuthService(db)
    return service.login(email=form_data.username, password=form_data.password)
