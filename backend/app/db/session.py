"""
SQLAlchemy engine + session factory, plus the FastAPI `get_db` dependency.

A single engine is created at import time and reused for the life of the
process (connection pooling handled by SQLAlchemy). Each request gets its
own Session via get_db, which is always closed after the request finishes -
including when an exception is raised.
"""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # avoids "server closed the connection unexpectedly" errors
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
