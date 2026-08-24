"""
Business logic for registration and login. Routes never touch the database
or hashing directly - they call into this service, which orchestrates the
repositories.
"""
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.company_repository import CompanyRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import Token
from app.schemas.user import UserCreate
from app.utils.exceptions import DuplicateEmailError, InactiveUserError, InvalidCredentialsError


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.companies = CompanyRepository(db)
        self.roles = RoleRepository(db)

    def register(self, payload: UserCreate) -> User:
        normalized_email = payload.email.lower()

        if self.users.email_exists(normalized_email):
            raise DuplicateEmailError()

        company = self.companies.get_or_create(payload.company_name)
        existing_users_count = (
            self.db.query(User)
            .filter(User.company_id == company.id, User.is_deleted.is_(False))
            .count()
        )
        if existing_users_count == 0:
            role = self.roles.get_or_create("admin")
        else:
            role = self.roles.get_or_create_default()

        user = User(
            email=normalized_email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            company_id=company.id,
            role_id=role.id,
        )
        return self.users.create(user)

    def authenticate(self, email: str, password: str) -> User:
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()
        if not user.is_active:
            raise InactiveUserError()
        return user

    def login(self, email: str, password: str) -> Token:
        user = self.authenticate(email, password)
        access_token = create_access_token(subject=str(user.id))
        return Token(access_token=access_token)
