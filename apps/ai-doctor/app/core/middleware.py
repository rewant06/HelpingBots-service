from __future__ import annotations

import json
import os
import time
from uuid import UUID, uuid4

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.datastructures import Headers
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.logging import get_request_logger

TRUSTED_HOSTS_ENV = "TRUSTED_HOSTS"
MAX_REQUEST_BYTES_ENV = "MAX_REQUEST_BYTES"
DEFAULT_MAX_REQUEST_BYTES = 1024 * 1024  # 1 MiB


def max_request_bytes() -> int:
    raw = os.getenv(MAX_REQUEST_BYTES_ENV)
    if not raw:
        return DEFAULT_MAX_REQUEST_BYTES
    try:
        return max(1, int(raw))
    except ValueError:
        return DEFAULT_MAX_REQUEST_BYTES


def trusted_hosts() -> list[str] | None:
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
        self.logger = get_request_logger()

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
    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
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
