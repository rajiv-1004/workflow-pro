import uuid
from datetime import date

from sqlalchemy import and_, asc, desc
from sqlalchemy.orm import Session

from app.models.enums import LeaveStatus, LeaveType
from app.models.leave import LeaveRequest
from app.models.user import User
from app.repositories.base_repository import BaseRepository

ALLOWED_LEAVE_SORT_FIELDS = {
    "start_date": LeaveRequest.start_date,
    "end_date": LeaveRequest.end_date,
    "status": LeaveRequest.status,
    "leave_type": LeaveRequest.leave_type,
    "created_at": LeaveRequest.created_at,
    "updated_at": LeaveRequest.updated_at,
}


class LeaveRepository(BaseRepository[LeaveRequest]):
    def __init__(self, db: Session):
        super().__init__(LeaveRequest, db)

    def get_by_id_and_company(self, id: uuid.UUID, company_id: uuid.UUID) -> LeaveRequest | None:
        return (
            self.db.query(LeaveRequest)
            .filter(
                LeaveRequest.id == id,
                LeaveRequest.company_id == company_id,
                LeaveRequest.is_deleted.is_(False),
            )
            .first()
        )

    def check_overlapping(
        self,
        company_id: uuid.UUID,
        employee_id: uuid.UUID,
        start_date: date,
        end_date: date,
        exclude_id: uuid.UUID | None = None,
    ) -> bool:
        query = self.db.query(LeaveRequest).filter(
            LeaveRequest.company_id == company_id,
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
            LeaveRequest.is_deleted.is_(False),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
        if exclude_id is not None:
            query = query.filter(LeaveRequest.id != exclude_id)
        return query.first() is not None

    def search_and_list(
        self,
        company_id: uuid.UUID,
        employee_id: uuid.UUID | None = None,
        department_id: uuid.UUID | None = None,
        leave_type: LeaveType | None = None,
        status: LeaveStatus | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        is_active: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[LeaveRequest], int]:
        query = self.db.query(LeaveRequest).filter(
            LeaveRequest.company_id == company_id,
            LeaveRequest.is_deleted.is_(False),
        )

        if employee_id is not None:
            query = query.filter(LeaveRequest.employee_id == employee_id)

        if department_id is not None:
            query = query.join(User, LeaveRequest.employee_id == User.id).filter(
                User.department_id == department_id
            )

        if leave_type is not None:
            query = query.filter(LeaveRequest.leave_type == leave_type)

        if status is not None:
            query = query.filter(LeaveRequest.status == status)

        if start_date is not None:
            query = query.filter(LeaveRequest.start_date >= start_date)

        if end_date is not None:
            query = query.filter(LeaveRequest.end_date <= end_date)

        if is_active is not None:
            query = query.filter(LeaveRequest.is_active == is_active)

        total = query.count()

        sort_column = ALLOWED_LEAVE_SORT_FIELDS.get(sort_by, LeaveRequest.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total
