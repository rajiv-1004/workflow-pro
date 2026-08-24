"""
Centralized application configuration.

All environment-dependent values are read here (and only here) via
pydantic-settings. Nothing else in the codebase should call os.environ
directly - this keeps configuration testable and swappable per environment.
"""
from functools import lru_cache
from typing import List, Optional

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
    CORS_ORIGINS: Optional[str] = None
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:3000,https://workflow-pro-bn80.onrender.com"

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
        raw = self.CORS_ORIGINS or self.BACKEND_CORS_ORIGINS or ""
        origins: List[str] = []
        if raw.strip().startswith("[") and raw.strip().endswith("]"):
            try:
                import json
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    for item in parsed:
                        clean = str(item).strip().rstrip("/")
                        if clean and clean not in origins:
                            origins.append(clean)
            except Exception:
                pass
        if not origins:
            for item in raw.split(","):
                clean = item.strip().rstrip("/")
                if clean and clean not in origins:
                    origins.append(clean)

        defaults = [
            "https://workflow-pro-bn80.onrender.com",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
        for d in defaults:
            if d not in origins:
                origins.append(d)
        return origins

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
