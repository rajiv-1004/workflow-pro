from fastapi import APIRouter

from app.api.v1 import (
    attendance,
    auth,
    dashboard,
    departments,
    employees,
    leaves,
    notifications,
    profile,
    projects,
    reports,
    search,
    tasks,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(departments.router)
api_router.include_router(employees.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(leaves.router)
api_router.include_router(attendance.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
api_router.include_router(search.router)
api_router.include_router(profile.router)
api_router.include_router(reports.router)

