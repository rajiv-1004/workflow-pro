import uuid
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.models.enums import LeaveStatus, LeaveType, NotificationType
from app.models.leave import LeaveRequest
from app.repositories.leave_repository import LeaveRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.leave import LeaveCreate, LeaveReview, LeaveUpdate
from app.utils.exceptions import ConflictError, ForbiddenError, NotFoundError


class LeaveService:
    def __init__(self, db: Session):
        self.db = db
        self.leaves = LeaveRepository(db)
        self.users = UserRepository(db)
        self.notifications = NotificationRepository(db)

    def create(self, company_id: uuid.UUID, employee_id: uuid.UUID, payload: LeaveCreate) -> LeaveRequest:
        emp = self.users.get_by_id_and_company(id=employee_id, company_id=company_id)
        if not emp:
            raise NotFoundError("Employee not found in your company.")
        if not emp.is_active:
            raise ConflictError("Inactive employees cannot request leave.")

        if payload.end_date < payload.start_date:
            raise ConflictError("end_date cannot be earlier than start_date.")

        if self.leaves.check_overlapping(
            company_id=company_id,
            employee_id=employee_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
        ):
            raise ConflictError("You already have an active or pending leave request overlapping with this date range.")

        leave = LeaveRequest(
            company_id=company_id,
            employee_id=employee_id,
            leave_type=payload.leave_type,
            start_date=payload.start_date,
            end_date=payload.end_date,
            reason=payload.reason,
            status=LeaveStatus.PENDING,
        )
        return self.leaves.create(leave)

    def get(self, company_id: uuid.UUID, leave_id: uuid.UUID) -> LeaveRequest:
        leave = self.leaves.get_by_id_and_company(id=leave_id, company_id=company_id)
        if not leave:
            raise NotFoundError("Leave request not found.")
        return leave

    def list(
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
        return self.leaves.search_and_list(
            company_id=company_id,
            employee_id=employee_id,
            department_id=department_id,
            leave_type=leave_type,
            status=status,
            start_date=start_date,
            end_date=end_date,
            is_active=is_active,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

    def update(
        self, company_id: uuid.UUID, employee_id: uuid.UUID, leave_id: uuid.UUID, payload: LeaveUpdate
    ) -> LeaveRequest:
        leave = self.get(company_id=company_id, leave_id=leave_id)

        if leave.employee_id != employee_id:
            raise ForbiddenError("You can only edit your own leave requests.")

        if leave.status != LeaveStatus.PENDING:
            raise ConflictError("Only PENDING leave requests can be updated.")

        new_start = payload.start_date if payload.start_date is not None else leave.start_date
        new_end = payload.end_date if payload.end_date is not None else leave.end_date

        if new_end < new_start:
            raise ConflictError("end_date cannot be earlier than start_date.")

        if self.leaves.check_overlapping(
            company_id=company_id,
            employee_id=employee_id,
            start_date=new_start,
            end_date=new_end,
            exclude_id=leave.id,
        ):
            raise ConflictError("Overlapping leave request exists for the updated dates.")

        if payload.leave_type is not None:
            leave.leave_type = payload.leave_type
        if payload.start_date is not None:
            leave.start_date = payload.start_date
        if payload.end_date is not None:
            leave.end_date = payload.end_date
        if payload.reason is not None:
            leave.reason = payload.reason

        self.db.commit()
        self.db.refresh(leave)
        return leave

    def approve(
        self, company_id: uuid.UUID, reviewer_id: uuid.UUID, leave_id: uuid.UUID, payload: LeaveReview | None = None
    ) -> LeaveRequest:
        leave = self.get(company_id=company_id, leave_id=leave_id)

        if leave.status != LeaveStatus.PENDING:
            raise ConflictError("Only PENDING leave requests can be approved.")

        if leave.employee_id == reviewer_id:
            raise ForbiddenError("You cannot approve your own leave request.")

        leave.status = LeaveStatus.APPROVED
        leave.reviewed_by_id = reviewer_id
        leave.reviewed_at = datetime.now(timezone.utc)
        if payload and payload.review_comment is not None:
            leave.review_comment = payload.review_comment

        self.db.commit()
        self.db.refresh(leave)

        self.notifications.create_notification(
            company_id=company_id,
            user_id=leave.employee_id,
            type=NotificationType.LEAVE_APPROVED,
            title="Leave Request Approved",
            message=f"Your {leave.leave_type.value} leave request for {leave.start_date} to {leave.end_date} has been approved.",
            resource_type="leave",
            resource_id=leave.id,
        )

        return leave

    def reject(
        self, company_id: uuid.UUID, reviewer_id: uuid.UUID, leave_id: uuid.UUID, payload: LeaveReview | None = None
    ) -> LeaveRequest:
        leave = self.get(company_id=company_id, leave_id=leave_id)

        if leave.status != LeaveStatus.PENDING:
            raise ConflictError("Only PENDING leave requests can be rejected.")

        if leave.employee_id == reviewer_id:
            raise ForbiddenError("You cannot reject your own leave request.")

        leave.status = LeaveStatus.REJECTED
        leave.reviewed_by_id = reviewer_id
        leave.reviewed_at = datetime.now(timezone.utc)
        if payload and payload.review_comment is not None:
            leave.review_comment = payload.review_comment

        self.db.commit()
        self.db.refresh(leave)

        self.notifications.create_notification(
            company_id=company_id,
            user_id=leave.employee_id,
            type=NotificationType.LEAVE_REJECTED,
            title="Leave Request Rejected",
            message=f"Your {leave.leave_type.value} leave request for {leave.start_date} to {leave.end_date} was rejected.",
            resource_type="leave",
            resource_id=leave.id,
        )

        return leave

    def cancel(self, company_id: uuid.UUID, employee_id: uuid.UUID, leave_id: uuid.UUID) -> LeaveRequest:
        leave = self.get(company_id=company_id, leave_id=leave_id)

        if leave.employee_id != employee_id:
            raise ForbiddenError("You can only cancel your own leave requests.")

        if leave.status != LeaveStatus.PENDING:
            raise ConflictError("Only PENDING leave requests can be cancelled.")

        leave.status = LeaveStatus.CANCELLED
        self.db.commit()
        self.db.refresh(leave)
        return leave
