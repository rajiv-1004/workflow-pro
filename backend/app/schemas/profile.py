import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    is_active: bool
    company_id: uuid.UUID
    role_id: uuid.UUID
    role_name: str
    company_name: str
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_password_match(self) -> "PasswordChangeRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password do not match.")
        return self


class PasswordChangeResponse(BaseModel):
    message: str
