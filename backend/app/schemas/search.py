import uuid
from pydantic import BaseModel, Field


class SearchItem(BaseModel):
    id: uuid.UUID
    title: str
    subtitle: str | None = None
    type: str  # 'employee' | 'department' | 'project' | 'task'
    url: str


class SearchResultsCategory(BaseModel):
    employees: list[SearchItem] = []
    departments: list[SearchItem] = []
    projects: list[SearchItem] = []
    tasks: list[SearchItem] = []


class SearchResponse(BaseModel):
    query: str
    results: SearchResultsCategory
    total: int
