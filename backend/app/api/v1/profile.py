from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.profile import PasswordChangeRequest, PasswordChangeResponse, ProfileResponse, ProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profile", tags=["Profile & Account"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ProfileService(db)
    return service.get_profile(user_id=current_user.id, company_id=current_user.company_id)


@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ProfileService(db)
    return service.update_profile(
        user_id=current_user.id, company_id=current_user.company_id, payload=payload
    )


@router.patch("/change-password", response_model=PasswordChangeResponse)
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ProfileService(db)
    return service.change_password(
        user_id=current_user.id, company_id=current_user.company_id, payload=payload
    )
