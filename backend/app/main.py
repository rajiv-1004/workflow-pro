from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging, RequestLoggingMiddleware
from app.middleware.error_handler import register_exception_handlers


def create_app() -> FastAPI:
    # Initialize structured logging subsystem
    setup_logging()

    app = FastAPI(
        title=settings.APP_NAME,
        description="Enterprise Employee & Task Management SaaS - REST API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Register request logging middleware
    app.add_middleware(RequestLoggingMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_origin_regex=r"https://.*\.onrender\.com",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(health_router)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
