"""
Centralized structured logging configuration for WorkFlow Pro.
Provides structured log formatting with ISO timestamps, log level,
logger name, and sanitized request context.
"""
import json
import logging
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.config import settings


class StructuredJsonFormatter(logging.Formatter):
    """
    JSON log formatter for production environments.
    Formats log records into structured JSON lines.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include additional extra context if provided
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_payload.update(record.extra_data)

        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_payload, default=str)


class StandardFormatter(logging.Formatter):
    """
    Readable color-friendly standard formatter for local development.
    """

    def __init__(self):
        super().__init__(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )


def setup_logging() -> None:
    """
    Initializes root and application loggers according to environment settings.
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Clear existing handlers to prevent duplicate output
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    if settings.ENVIRONMENT.lower() == "production":
        console_handler.setFormatter(StructuredJsonFormatter())
    else:
        console_handler.setFormatter(StandardFormatter())

    root_logger.addHandler(console_handler)

    # Tone down noisy external libraries in development/production
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("passlib").setLevel(logging.WARNING)


logger = logging.getLogger("workflow_pro")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs incoming HTTP requests and response performance metrics.
    Ensures zero leak of sensitive credentials, tokens, or passwords.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path

        # Process the request
        try:
            response = await call_next(request)
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            status_code = response.status_code

            # Log request outcome (exclude high-frequency /health endpoint from verbose logging)
            if path != "/health":
                logger.info(
                    f"{method} {path} -> {status_code} ({process_time_ms}ms) [client: {client_ip}]",
                    extra={
                        "extra_data": {
                            "http_method": method,
                            "path": path,
                            "status_code": status_code,
                            "duration_ms": process_time_ms,
                            "client_ip": client_ip,
                        }
                    },
                )
            return response
        except Exception as exc:
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled exception during {method} {path} ({process_time_ms}ms): {exc}",
                exc_info=True,
                extra={
                    "extra_data": {
                        "http_method": method,
                        "path": path,
                        "duration_ms": process_time_ms,
                        "client_ip": client_ip,
                    }
                },
            )
            raise
