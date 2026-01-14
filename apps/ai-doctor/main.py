# apps/ai-doctor/main.py
from __future__ import annotations
import os

from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


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

@app.get("/v1/meta")
async def meta() -> JSONResponse: 
    return JSONResponse(
        content={
            "version": os.getenv("SERICE_VERSION", "1.0.0"),
            "environment": os.getenv("ENV", "dev"),
            "features": {"dev_auth": os.getenv("FEATURE_DEV_AUTH", "false").lower() == "true", "jwt_auth": os.getenv("FEATURE_DEV_AUTH", "false").lower() == "true"}
        }
    )
