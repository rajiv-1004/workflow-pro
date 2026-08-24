from sqlalchemy.orm import Session

from app.models.role import Role


class RoleRepository:
    """Role has no soft-delete column, so it doesn't use BaseRepository."""

    DEFAULT_ROLE_NAME = "employee"

    def __init__(self, db: Session):
        self.db = db

    def get_by_name(self, name: str) -> Role | None:
        return self.db.query(Role).filter(Role.name == name).first()

    def get_or_create(self, name: str) -> Role:
        role = self.get_by_name(name)
        if role:
            return role
        role = Role(name=name)
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def get_or_create_default(self) -> Role:
        return self.get_or_create(self.DEFAULT_ROLE_NAME)
