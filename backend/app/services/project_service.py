import uuid

from sqlalchemy.orm import Session

from app.models.enums import ProjectStatus
from app.models.project import Project
from app.repositories.department_repository import DepartmentRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.utils.exceptions import ConflictError, NotFoundError


class ProjectService:
    def __init__(self, db: Session):
        self.db = db
        self.projects = ProjectRepository(db)
        self.departments = DepartmentRepository(db)
        self.users = UserRepository(db)

    def create(self, company_id: uuid.UUID, payload: ProjectCreate) -> Project:
        if self.projects.get_by_name(company_id=company_id, name=payload.name):
            raise ConflictError("A project with this name already exists in the company.")

        if payload.department_id is not None:
            department = self.departments.get_by_id_and_company(id=payload.department_id, company_id=company_id)
            if not department:
                raise NotFoundError("Department not found in your company.")
            if not department.is_active:
                raise ConflictError("Cannot assign project to an inactive department.")

        if payload.manager_id is not None:
            manager = self.users.get_by_id_and_company(id=payload.manager_id, company_id=company_id)
            if not manager:
                raise NotFoundError("Project manager not found in your company.")
            if not manager.is_active:
                raise ConflictError("Cannot assign an inactive user as project manager.")

        if payload.start_date is not None and payload.due_date is not None:
            if payload.due_date < payload.start_date:
                raise ConflictError("due_date cannot be earlier than start_date.")

        project = Project(
            name=payload.name,
            description=payload.description,
            status=payload.status,
            start_date=payload.start_date,
            due_date=payload.due_date,
            company_id=company_id,
            department_id=payload.department_id,
            manager_id=payload.manager_id,
        )
        return self.projects.create(project)

    def get(self, company_id: uuid.UUID, project_id: uuid.UUID) -> Project:
        project = self.projects.get_by_id_and_company(id=project_id, company_id=company_id)
        if not project:
            raise NotFoundError("Project not found.")
        return project

    def list(
        self,
        company_id: uuid.UUID,
        search: str | None = None,
        status: ProjectStatus | None = None,
        department_id: uuid.UUID | None = None,
        manager_id: uuid.UUID | None = None,
        is_active: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Project], int]:
        return self.projects.search_and_list(
            company_id=company_id,
            search=search,
            status=status,
            department_id=department_id,
            manager_id=manager_id,
            is_active=is_active,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

    def update(
        self, company_id: uuid.UUID, project_id: uuid.UUID, payload: ProjectUpdate
    ) -> Project:
        project = self.get(company_id=company_id, project_id=project_id)

        if not project.is_active:
            raise ConflictError("Cannot update an inactive project.")

        if payload.name is not None and payload.name != project.name:
            if self.projects.get_by_name(company_id=company_id, name=payload.name):
                raise ConflictError("A project with this name already exists in the company.")
            project.name = payload.name

        if payload.description is not None:
            project.description = payload.description

        if payload.department_id is not None:
            department = self.departments.get_by_id_and_company(id=payload.department_id, company_id=company_id)
            if not department:
                raise NotFoundError("Department not found in your company.")
            if not department.is_active:
                raise ConflictError("Cannot assign project to an inactive department.")
            project.department_id = payload.department_id

        if payload.manager_id is not None:
            manager = self.users.get_by_id_and_company(id=payload.manager_id, company_id=company_id)
            if not manager:
                raise NotFoundError("Project manager not found in your company.")
            if not manager.is_active:
                raise ConflictError("Cannot assign an inactive user as project manager.")
            project.manager_id = payload.manager_id

        # Validate combined dates
        new_start = payload.start_date if payload.start_date is not None else project.start_date
        new_due = payload.due_date if payload.due_date is not None else project.due_date
        if new_start is not None and new_due is not None and new_due < new_start:
            raise ConflictError("due_date cannot be earlier than start_date.")

        if payload.start_date is not None:
            project.start_date = payload.start_date

        if payload.due_date is not None:
            project.due_date = payload.due_date

        if payload.status is not None:
            project.status = payload.status

        self.db.commit()
        self.db.refresh(project)
        return project

    def update_status(
        self, company_id: uuid.UUID, project_id: uuid.UUID, status: ProjectStatus
    ) -> Project:
        project = self.get(company_id=company_id, project_id=project_id)
        if not project.is_active:
            raise ConflictError("Cannot update status of an inactive project.")
        project.status = status
        self.db.commit()
        self.db.refresh(project)
        return project

    def deactivate(self, company_id: uuid.UUID, project_id: uuid.UUID) -> Project:
        project = self.get(company_id=company_id, project_id=project_id)
        project.is_active = False
        self.db.commit()
        self.db.refresh(project)
        return project
