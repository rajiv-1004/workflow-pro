import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=150)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    company_name: str = Field(
        ..., min_length=2, max_length=150,
        description="Name of the company this user (and its account) belongs to.",
    )


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    company_id: uuid.UUID
    role_id: uuid.UUID
    role: RoleResponse | None = None
    created_at: datetime
    updated_at: datetime
