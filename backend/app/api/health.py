from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Liveness/readiness probe")
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return {"status": "degraded"}

    return {"status": "ok"}

