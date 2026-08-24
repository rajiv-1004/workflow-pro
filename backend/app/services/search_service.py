from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.search import SearchItem, SearchResponse, SearchResultsCategory


class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def search(self, current_user: User, q: str, limit: int = 5) -> SearchResponse:
        query_str = q.strip()
        company_id = current_user.company_id
        user_role = current_user.role.name if current_user.role else "employee"

        if len(query_str) < 2:
            return SearchResponse(
                query=query_str,
                results=SearchResultsCategory(),
                total=0,
            )

        pattern = f"%{query_str}%"

        # 1. Search Employees (if admin/manager or within company)
        emp_results: list[SearchItem] = []
        if user_role in ["admin", "manager"]:
            employees = (
                self.db.query(User)
                .filter(
                    User.company_id == company_id,
                    User.is_deleted.is_(False),
                    or_(
                        User.full_name.ilike(pattern),
                        User.email.ilike(pattern),
                    ),
                )
                .limit(limit)
                .all()
            )
            for e in employees:
                emp_results.append(
                    SearchItem(
                        id=e.id,
                        title=e.full_name,
                        subtitle=f"{e.email} • {e.role.name.upper() if e.role else 'EMPLOYEE'}",
                        type="employee",
                        url=f"/employees?search={e.full_name}",
                    )
                )

        # 2. Search Departments
        dept_results: list[SearchItem] = []
        departments = (
            self.db.query(Department)
            .filter(
                Department.company_id == company_id,
                Department.is_deleted.is_(False),
                Department.name.ilike(pattern),
            )
            .limit(limit)
            .all()
        )
        for d in departments:
            dept_results.append(
                SearchItem(
                    id=d.id,
                    title=d.name,
                    subtitle=d.description or "Department Unit",
                    type="department",
                    url=f"/departments?search={d.name}",
                )
            )

        # 3. Search Projects
        proj_results: list[SearchItem] = []
        projects = (
            self.db.query(Project)
            .filter(
                Project.company_id == company_id,
                Project.is_deleted.is_(False),
                or_(
                    Project.name.ilike(pattern),
                    Project.description.ilike(pattern),
                ),
            )
            .limit(limit)
            .all()
        )
        for p in projects:
            proj_results.append(
                SearchItem(
                    id=p.id,
                    title=p.name,
                    subtitle=f"Status: {p.status.value}",
                    type="project",
                    url=f"/projects/{p.id}",
                )
            )

        # 4. Search Tasks
        task_query = self.db.query(Task).filter(
            Task.company_id == company_id,
            Task.is_deleted.is_(False),
            or_(
                Task.title.ilike(pattern),
                Task.description.ilike(pattern),
            ),
        )
        if user_role == "employee":
            task_query = task_query.filter(Task.assigned_to_id == current_user.id)

        tasks = task_query.limit(limit).all()
        task_results: list[SearchItem] = []
        for t in tasks:
            task_results.append(
                SearchItem(
                    id=t.id,
                    title=t.title,
                    subtitle=f"{t.priority.value} Priority • {t.status.value}",
                    type="task",
                    url=f"/tasks/{t.id}",
                )
            )

        total_matches = len(emp_results) + len(dept_results) + len(proj_results) + len(task_results)

        return SearchResponse(
            query=query_str,
            results=SearchResultsCategory(
                employees=emp_results,
                departments=dept_results,
                projects=proj_results,
                tasks=task_results,
            ),
            total=total_matches,
        )
