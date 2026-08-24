"""
Domain-level exceptions.

Services raise these instead of HTTPException directly, which keeps the
service layer framework-agnostic. The API layer / exception handlers
translate them into proper HTTP responses (see app.middleware.error_handler).
"""


class AppException(Exception):
    """Base class for all predictable, handled application errors."""

    status_code: int = 400
    detail: str = "An application error occurred."

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.detail
        super().__init__(self.detail)


class DuplicateEmailError(AppException):
    status_code = 409
    detail = "A user with this email already exists."


class InvalidCredentialsError(AppException):
    status_code = 401
    detail = "Incorrect email or password."


class InactiveUserError(AppException):
    status_code = 403
    detail = "This user account is inactive."


class UserNotFoundError(AppException):
    status_code = 404
    detail = "User not found."


class NotAuthenticatedError(AppException):
    status_code = 401
    detail = "Could not validate credentials."


class NotFoundError(AppException):
    status_code = 404
    detail = "Resource not found."


class ConflictError(AppException):
    status_code = 409
    detail = "Resource conflict."


class ForbiddenError(AppException):
    status_code = 403
    detail = "You do not have permission to perform this action."
