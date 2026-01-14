from __future__ import annotations

import os
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

FEATURE_DEV_AUTH_ENV = "FEATURE_DEV_AUTH"

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


app = FastAPI(
    title="Dr. Reach API",
    version="1.0.0",
)

app.add_middleware(CorrelationIdMiddleware)

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

@app.get("/healthz")
async def healthz() -> JSONResponse:
    return JSONResponse(content={"status": "ok"})

@app.get("/readyz")
async def readyz() -> JSONResponse:
    return JSONResponse(content={"status": "ok"})

class VersionCheckResponse(BaseModel):
    sub: str
    active_tenant_id: str
    uv_current: int
    mv_current: int 
    user_status: str
    membership_status: str
    
    
def _feature_enabled(name: str) -> bool:
    return os.getenv(name, "false").strip().lower() == "true"


def _get_dev_actor_from_headers(request: Request) -> tuple[str, str]:
    user_id = request.headers.get("X-Debug-User-Id")
    tenant_id = request.headers.get("X-Debug-Tenant-Id")
    if not user_id or not tenant_id:
        raise HTTPException(status_code=401, detail="Missing X-Debug-User-Id or X-Debug-Tenant-Id")
    return user_id, tenant_id

@app.get("/authz/version")
async def authz_version(request: Request) -> JSONResponse:
    # phase 1: Dev auth only
    if not _feature_enabled(FEATURE_DEV_AUTH_ENV):
        raise HTTPException(status_code=501, detail="DEV_AUTH disabled; JWT/IAM authz not yet configured")
    
    sub, active_tenant_id = _get_dev_actor_from_headers(request)
    
    resp = VersionCheckResponse(
        sub=sub,
        active_tenant_id=active_tenant_id,
        uv_current=0,
        mv_current=0,
        user_status="active",
        membership_status="active",
    )
    return JSONResponse(content=resp.model_dump())


@app.get("/v1/meta")
async def meta() -> JSONResponse: 
    return JSONResponse(
        content={
            "version": os.getenv("SERICE_VERSION", "1.0.0"),
            "environment": os.getenv("ENV", "dev"),
            "features": {"dev_auth": os.getenv("FEATURE_DEV_AUTH", "false").lower() == "true", "jwt_auth": os.getenv("FEATURE_DEV_AUTH", "false").lower() == "true"}
        }
    )
