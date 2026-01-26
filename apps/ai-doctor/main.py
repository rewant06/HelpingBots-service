from __future__ import annotations

import json
import os
import time
from contextlib import asynccontextmanager
from urllib.parse import urlparse
from uuid import UUID, uuid4

import asyncpg
import logging
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.datastructures import Headers
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp, Message, Receive, Scope, Send
from starlette.responses import Response

_SENSITIVE_LOG_KEYS = {
    "password",
    "passwd",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "api_key",
    "apikey",
    "database_url",
    "dsn",
}

class RedactJsonFilter(logging.Filter):
    def __init__(self, keys: set[str]) -> None:
        super().__init__()
        self.keys = {k.lower() for k in keys}

    def filter(self, record: logging.LogRecord) -> bool:
        if not isinstance(record.msg, str):
            return True
        try:
            data = json.loads(record.msg)
        except Exception:
            return True
        if not isinstance(data, dict):
            return True
        changed = False
        for k in list(data.keys()):
            if str(k).lower() in self.keys:
                data[k] = "[REDACTED]"
                changed = True
        if changed:
            record.msg = json.dumps(data, separators=(",", ":"))
            record.args = ()
        return True

def _get_request_logger() -> logging.Logger:
    logger = logging.getLogger("app.request")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        h = logging.StreamHandler()
        h.setFormatter(logging.Formatter("%(message)s"))
        h.addFilter(RedactJsonFilter(_SENSITIVE_LOG_KEYS))
        logger.addHandler(h)
        logger.propagate = False
    return logger
_get_request_logger()

FEATURE_DEV_AUTH_ENV = "FEATURE_DEV_AUTH"
FEATURE_JWT_AUTH_ENV = "FEATURE_JWT_AUTH"
TRUSTED_HOSTS_ENV = "TRUSTED_HOSTS"

MAX_REQUEST_BYTES_ENV = "MAX_REQUEST_BYTES"
DEFAULT_MAX_REQUEST_BYTES = 1024 * 1024  # 1 MiB

def _max_request_bytes() -> int:
    raw = os.getenv(MAX_REQUEST_BYTES_ENV)
    if not raw:
        return DEFAULT_MAX_REQUEST_BYTES
    try:
        return max(1, int(raw))
    except ValueError:
        return DEFAULT_MAX_REQUEST_BYTES
    
def _trusted_hosts() -> list[str] | None:
    raw = os.getenv(TRUSTED_HOSTS_ENV)
    if not raw:
        return None
    hosts = [h.strip().lower() for h in raw.split(",") if h.strip()]
    return hosts or None

    
def _correlation_id_from_scope(scope: Scope) -> str:
    headers = Headers(raw=scope.get("headers") or [])
    incoming = headers.get("X-Correlation-Id")
    if incoming:
        try: 
            return str(UUID(incoming))
        except ValueError:
            pass
    return str(uuid4())

def _host_from_scope(scope: Scope) -> str | None:
    headers = Headers(raw=scope.get("headers") or [])
    host = headers.get("host")
    if not host:
        return None
    return host.split(":")[0].strip().lower()

class TrustedHostsMiddleware:
    def __init__(self, app: ASGIApp, allowed_hosts: list[str]) -> None:
        self.app = app
        self.allowed_hosts = allowed_hosts
        
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return 
        
        if "*" in self.allowed_hosts:
            await self.app(scope, receive, send)
            return
        
        host = _host_from_scope(scope)
        if host and host in self.allowed_hosts:
            await self.app(scope, receive, send)
            return
        
        correlation_id = _correlation_id_from_scope(scope)
        resp = JSONResponse(
            status_code=400,
            content={
                "error": "http_error",
                "message": "Invalid host",
                "correlation_id": correlation_id,
                "details": None,
            },
            headers={
                "X-Correlation-Id": correlation_id,
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Referrer-Policy": "no-referrer",
            },
        )
        await resp(scope, receive, send)
        
class RequestLogMiddleware:
    header_name = b"x-correlation-id"
    
    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.logger = _get_request_logger()
        
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        start = time.perf_counter()
        status_code: int | None = None
        correlation_id: str | None = None
        
        async def send_wrapper(message: Message) -> None:
            nonlocal status_code, correlation_id
            if message["type"] == "http.response.start":
                status_code = int(message["status"])
                for k, v in message.get("headers", []):
                    if k.lower() == self.header_name:
                        correlation_id = v.decode("utf-8", errors="replace")
                        break
            await send(message)
            
        try: 
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = int((time.perf_counter() - start) * 1000)
            self.logger.info(
                json.dumps(
                    {
                        "event": "request",
                        "method": scope.get("method"),
                        "path": scope.get("path"),
                        "status_code": status_code,
                        "duration_ms": duration_ms,
                        "correlation_id": correlation_id,
                    },
                     separators=(",", ":"),
                )
            )

class RequestSizeLimitMiddleware:
    def __init__(self, app:ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes
        
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        received = 0
        correlation_id = _correlation_id_from_scope(scope)
        headers = Headers(raw=scope.get("headers") or [])
        
        content_length = headers.get("content-length")
        if content_length:
            try: 
                if int(content_length) > self.max_bytes:
                    resp = JSONResponse(
                        status_code=413,
                        content={
                            "error": "http_error",
                            "message": "Request body too large",
                            "correlation_id": correlation_id,
                            "details": None,
                        },
                        headers={"X-Correlation-Id": correlation_id},
                    )
                    await resp(scope, receive, send)
                    return
            except ValueError:
                pass
        
        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] != "http.request":
                return message
            body = message.get("body", b"") or b""
            received += len(body)
            if received > self.max_bytes:
                raise HTTPException(status_code=413, detail="Request body too large")
            return message
        try: 
            await self.app(scope, limited_receive, send)
        except HTTPException as exc:
            if exc.status_code != 413:
                raise
            resp = JSONResponse(
                status_code=413,
                content={
                    "error": "http_error",
                    "message": "Request body too large",
                    "correlation_id": correlation_id,
                    "details": None,
                },
                headers={"X-Correlation-Id": correlation_id},
            )
            await resp(scope, receive, send)
            
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        return response
    

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

@asynccontextmanager
async def lifespan(_:FastAPI):
    global _db_pool
    global _db_init_failed
    
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        _db_pool = None
        _db_init_failed = False
    else: 
        try: 
            u = urlparse(dsn)
            _db_pool = await asyncpg.create_pool(
                host=u.hostname,
                port=u.port or 5432,
                user=u.username,
                password=u.password,
                database=(u.path or "/postgres").lstrip("/"),
                min_size=1, 
                max_size=5,
                ssl="require",
                )
            _db_init_failed = False
        except Exception as e: 
            logging.getLogger(__name__).warning("db_pool_init_failed: %s", type(e).__name__)
            _db_pool = None
            _db_init_failed = True

    yield
    
    if _db_pool is not None:
        await _db_pool.close()
    _db_pool = None
    _db_init_failed = False

app = FastAPI(
    title="Dr. Reach API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_bytes=_max_request_bytes())
app.add_middleware(SecurityHeadersMiddleware)
_allowed_hosts = _trusted_hosts()
if _allowed_hosts:
    app.add_middleware(TrustedHostsMiddleware, allowed_hosts=_allowed_hosts)
app.add_middleware(RequestLogMiddleware)
    
    
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
