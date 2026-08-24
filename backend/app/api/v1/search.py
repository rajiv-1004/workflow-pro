from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.search import SearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("", response_model=SearchResponse)
def search_all(
    q: str = Query(..., min_length=1, max_length=50, description="Search query string"),
    limit: int = Query(5, ge=1, le=20, description="Max results per category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = SearchService(db)
    return service.search(current_user=current_user, q=q, limit=limit)
