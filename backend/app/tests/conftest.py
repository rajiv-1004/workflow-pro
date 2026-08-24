"""
Test fixtures.

Tests run against an isolated in-memory SQLite database (not the real
Postgres) so the suite is fast and has zero external dependencies. The
`get_db` FastAPI dependency is overridden per-test so app code is unchanged.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db.base_class import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user_payload():
    return {
        "email": "jane.doe@example.com",
        "full_name": "Jane Doe",
        "password": "SuperSecret123",
        "company_name": "Acme Corp",
    }


def _create_user_and_token(client, email, name, role_name, company_name="Acme Corp"):
    # Registration auto-creates company and assigns "employee" role
    # So we register them first to create the account
    payload = {
        "email": email,
        "full_name": name,
        "password": "Password123",
        "company_name": company_name,
    }
    client.post("/api/v1/auth/register", json=payload)
    
    # We need to manually update their role in the DB to make them admin/manager for testing
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.models.role import Role
    from app.repositories.role_repository import RoleRepository
    
    # Actually wait, tests use overridden db. We must use the overridden one
    # So let's fetch the test_client app's dependency overridden db
    from app.db.session import get_db
    from app.main import app
    db = next(app.dependency_overrides[get_db]())
    
    user = db.query(User).filter(User.email == email).first()
    
    # Create or get role and ensure user has the designated role
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = Role(name=role_name)
        db.add(role)
        db.commit()
        db.refresh(role)
    
    user.role_id = role.id
    db.commit()
    
    db.close()
    
    # Now login to get token
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "Password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_user_token_headers(client):
    return _create_user_and_token(client, "admin@acme.com", "Admin", "admin", "Acme Corp")


@pytest.fixture()
def normal_user_token_headers(client):
    return _create_user_and_token(client, "employee@acme.com", "Emp", "employee", "Acme Corp")


@pytest.fixture()
def other_company_admin_token_headers(client):
    return _create_user_and_token(client, "admin@other.com", "Other Admin", "admin", "Other Corp")
