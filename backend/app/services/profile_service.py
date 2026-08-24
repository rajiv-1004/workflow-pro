import uuid

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.profile import PasswordChangeRequest, PasswordChangeResponse, ProfileResponse, ProfileUpdate
from app.utils.exceptions import ConflictError, InvalidCredentialsError, NotFoundError


class ProfileService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def get_profile(self, user_id: uuid.UUID, company_id: uuid.UUID) -> ProfileResponse:
        user = self.users.get_by_id_and_company(id=user_id, company_id=company_id)
        if not user:
            raise NotFoundError("User profile not found.")

        return ProfileResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            company_id=user.company_id,
            role_id=user.role_id,
            role_name=user.role.name if user.role else "employee",
            company_name=user.company.name if user.company else "Company",
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def update_profile(
        self, user_id: uuid.UUID, company_id: uuid.UUID, payload: ProfileUpdate
    ) -> ProfileResponse:
        user = self.users.get_by_id_and_company(id=user_id, company_id=company_id)
        if not user:
            raise NotFoundError("User profile not found.")

        user.full_name = payload.full_name.strip()
        self.db.commit()
        self.db.refresh(user)

        return self.get_profile(user_id=user_id, company_id=company_id)

    def change_password(
        self, user_id: uuid.UUID, company_id: uuid.UUID, payload: PasswordChangeRequest
    ) -> PasswordChangeResponse:
        user = self.users.get_by_id_and_company(id=user_id, company_id=company_id)
        if not user:
            raise NotFoundError("User profile not found.")

        if not verify_password(payload.current_password, user.hashed_password):
            raise InvalidCredentialsError("Current password is incorrect.")

        if verify_password(payload.new_password, user.hashed_password):
            raise ConflictError("New password must be different from current password.")

        user.hashed_password = hash_password(payload.new_password)
        self.db.commit()

        return PasswordChangeResponse(message="Password changed successfully.")
