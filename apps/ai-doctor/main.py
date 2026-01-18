from __future__ import annotations

import os
from uuid import UUID, uuid4

import asyncpg
import logging
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

FEATURE_DEV_AUTH_ENV = "FEATURE_DEV_AUTH"
FEATURE_JWT_AUTH_ENV = "FEATURE_JWT_AUTH"

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    header_name = "X-Correlation-Id"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        incoming = request.headers.get(self.header_name)
        correlation_id = None
        if incoming:
            try:
                correlation_id = str(UUID(incoming))
            except ValueError:
                correlation_id = None
        if not correlation_id:
            correlation_id = str(uuid4())
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers[self.header_name] = correlation_id
        return response
def _correlation_id(request: Request) -> str | None:
    return getattr(request.state, "correlation_id", None)

_db_pool: asyncpg.Pool | None = None
_db_init_failed = False


app = FastAPI(
    title="Dr. Reach API",
    version="1.0.0",
)

app.add_middleware(CorrelationIdMiddleware)

@app.on_event("startup")
async def _startup() -> None:
    global _db_pool
    global _db_init_failed
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        _db_pool = None
        _db_init_failed = False
        return
    # _db_pool = await asyncpg.create_pool(dsn=dsn, min_size=1, max_size=5)
    try: 
        _db_pool = await asyncpg.create_pool(dsn=dsn, min_size=1, max_size=5)
        _db_init_failed = False
    except Exception as e:
        logging.getLogger(__name__).warning("db_pool_init_failed: %s", str(e))
        _db_pool = None
        _db_init_failed = True
    
@app.on_event("shutdown")
async def _shutdown() -> None:
    global _db_pool
    global _db_init_failed
    if _db_pool is not None:
        await _db_pool.close()
    _db_pool = None
    _db_init_failed = False
    
    
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "http_error",
            "message": exc.detail if isinstance(exc.detail, str) else "Request failed",
            "correlation_id": _correlation_id(request),
            "details": exc.detail if isinstance(exc.detail, dict) else None,
        },
    )
    
@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "http_error",
            "message": exc.detail if isinstance(exc.detail, str) else "Request failed",
            "correlation_id": _correlation_id(request),
            "details": None,
        },
    )
    
    
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "Validation failed",
            "correlation_id": _correlation_id(request),
            "details": {"errors": exc.errors()},
        },
    )


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str
    
@app.get("/healthz", response_model=HealthResponse)
async def healthz() -> HealthResponse:
    return HealthResponse(status="ok")

@app.get("/readyz", response_model=HealthResponse)
async def readyz() -> HealthResponse:
    # return JSONResponse(content={"status": "ok"})
    if _db_init_failed:
        raise HTTPException(status_code=503, detail="Database not ready")
    
    if _db_pool is not None:
        try: 
            async with _db_pool.acquire() as conn:
                await conn.execute("SELECT 1")
        except Exception:
            raise HTTPException(status_code=503, detail="database not ready")
    return HealthResponse(status= "ok")

    
    
class VersionCheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sub: str
    active_tenant_id: str
    uv_current: int
    mv_current: int 
    user_status: str
    membership_status: str

class MetaResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: str
    environment: str
    features: dict[str, bool]
    
def _feature_enabled(name: str) -> bool:
    return os.getenv(name, "false").strip().lower() == "true"


def _get_dev_actor_from_headers(request: Request) -> tuple[str, str]:
    user_id = request.headers.get("X-Debug-User-Id")
    tenant_id = request.headers.get("X-Debug-Tenant-Id")
    if not user_id or not tenant_id:
        raise HTTPException(status_code=401, detail="Missing X-Debug-User-Id or X-Debug-Tenant-Id")
    return user_id, tenant_id

@app.get("/authz/version", response_model=VersionCheckResponse)
async def authz_version(request: Request) -> VersionCheckResponse:
    # phase 1: Dev auth only
    if not _feature_enabled(FEATURE_DEV_AUTH_ENV):
        raise HTTPException(status_code=501, detail="DEV_AUTH disabled; JWT/IAM authz not yet configured")
    
    sub, active_tenant_id = _get_dev_actor_from_headers(request)
    
    return VersionCheckResponse(
        sub=sub,
        active_tenant_id=active_tenant_id,
        uv_current=0,
        mv_current=0,
        user_status="active",
        membership_status="active",
    )


@app.get("/v1/meta", response_model=MetaResponse)
async def meta() -> MetaResponse: 
    return MetaResponse(
        
        version=os.getenv("SERVICE_VERSION", "1.0.0"),
        environment= os.getenv("ENV", "dev"),
        features= {
            "dev_auth": _feature_enabled(FEATURE_DEV_AUTH_ENV),
            "jwt_auth": _feature_enabled(FEATURE_JWT_AUTH_ENV)
        },
    )
