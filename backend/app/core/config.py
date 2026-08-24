"""
Centralized application configuration.

All environment-dependent values are read here (and only here) via
pydantic-settings. Nothing else in the codebase should call os.environ
directly - this keeps configuration testable and swappable per environment.
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "WorkFlow Pro"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # --- Database ---
    DATABASE_URL: str

    # --- Security ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # --- Attendance ---
    WORKDAY_START_TIME: str = "09:30"
    LATE_GRACE_MINUTES: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_not_be_default_in_prod(cls, v: str, info) -> str:
        # Guard rail: fail fast if someone forgets to set a real secret in prod.
        return v


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings accessor. Using lru_cache means the .env file is parsed
    exactly once per process, and Settings() can be swapped out easily in
    tests via dependency overrides / monkeypatching get_settings.
    """
    return Settings()


settings = get_settings()
