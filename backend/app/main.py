from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logger import get_logger
from app.core.security_headers import security_headers_middleware
from app.routes import admin, auth, dashboard, health, market, orders, portfolio, profile, transactions


settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info(
        "application.started",
        extra={
            "event": "application.started",
            "version": settings.app_version,
            "environment": settings.environment,
            "corsOrigins": settings.cors_origins,
            "securityHeadersEnabled": settings.security_headers_enabled,
        },
    )
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Trading simulator API with Supabase Auth, PostgreSQL-backed state, and Yahoo Finance market data.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    return await security_headers_middleware(request, call_next, settings)


register_exception_handlers(app)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(market.router)
app.include_router(dashboard.router)
app.include_router(portfolio.router)
app.include_router(profile.router)
app.include_router(transactions.router)
app.include_router(orders.router)
app.include_router(admin.router)
