from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.stocks import router as stocks_router
from app.api.v1.endpoints.history import router as history_router
from app.api.v1.endpoints.invoices import router as invoices_router

api_router = APIRouter()

api_router.include_router(
    health_router,
    prefix="/health",
    tags=["Health"]
)

api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    users_router,
    prefix="/users",
    tags=["Users"]
)

api_router.include_router(
    stocks_router,
    prefix="/stocks",
    tags=["Stocks"]
)

api_router.include_router(
    history_router,
    prefix="/history",
    tags=["History"]
)

api_router.include_router(
    invoices_router,
    prefix="/invoices",
    tags=["Invoices"]
)