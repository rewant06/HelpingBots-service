from __future__ import annotations

import hashlib
import json
import time
import os
from typing import Any

import httpx
from fastapi import HTTPException, Request

from app.core.auth.models import ActorContext
from app.core.logging import get_request_logger

IAM_SERVICE_URL_ENV = "IAM_SERVICE_URL"
FEATURE_JWT_AUTH_ENV = "FEATURE_JWT_AUTH"

UVMV_CACHE_TTL_SECONDS_ENV = "UVMV_CACHE_TTL_SECONDS"
DEFAULT_UVMV_CACHE_TTL_SECONDS = 30

_cache_logger = get_request_logger()

def _feature_enabled(name: str) -> bool:
    return os.getenv(name, "false").strip().lower() == "true"


def _iam_base_url() -> str:
    return (os.getenv(IAM_SERVICE_URL_ENV) or "http://localhost:8000").rstrip("/")

def _raise_401(detail: str, *, error: str | None = None) -> None:
    value = 'Bearer realm="drreach"'
    if error:
        value += f', error="{error}"'
    raise HTTPException(status_code=401, detail=detail, headers={"WWW-Authenticate": value})


def _extract_bearer_token(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth:
       _raise_401("Missing Authorization header")
    if not auth.lower().startswith("bearer "):
        _raise_401("Invalid Authorization scheme")
    token = auth.split(" ", 1)[1].strip()
    if not token:
        _raise_401("Missing bearer token")
    return token

def _uvmv_cache_ttl_seconds() -> int:
    raw = os.getenv(UVMV_CACHE_TTL_SECONDS_ENV)
    if not raw:
        return DEFAULT_UVMV_CACHE_TTL_SECONDS
    try:
        return max(0, int(raw))
    except ValueError:
        return DEFAULT_UVMV_CACHE_TTL_SECONDS


# token_hash -> (expires_at_epoch_seconds, ActorContext)
_UVMV_CACHE: dict[str, tuple[float, ActorContext]] = {}


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()



async def require_actor_context(request: Request) -> ActorContext:
    # Precedence: JWT/IAM mode first
    if _feature_enabled(FEATURE_JWT_AUTH_ENV):
        token = _extract_bearer_token(request)
        now = time.time()
        key = _token_hash(token)
        ttl = _uvmv_cache_ttl_seconds()
        
        cached = _UVMV_CACHE.get(key)
        if cached is not None:
            exp, ctx = cached
            if exp >= now:
                _cache_logger.info(
                    json.dumps(
                        {
                            "event": "uvmv_cache",
                            "result": "hit",
                            "correlation_id": getattr(request.state, "correlation_id", None),
                        },
                        separators=(",", ":"),
                    )
                )
                request.state.actor_context = ctx
                return ctx

            _UVMV_CACHE.pop(key, None)
            
        _cache_logger.info(
            json.dumps(
                {
                    "event": "uvmv_cache",
                    "result": "miss",
                    "correlation_id": getattr(request.state, "correlation_id", None),
                },
                separators=(",", ":"),
            )
        )

        url = f"{_iam_base_url()}/authz/uvmv/verify"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, headers={"Authorization": f"Bearer {token}"})
        except httpx.TimeoutException:
            raise HTTPException(status_code=503, detail="Authentication service timeout")
        except httpx.HTTPError:
            raise HTTPException(status_code=503, detail="Authentication service unavailable")

        if resp.status_code == 401:
            _raise_401("Invalid or expired token", error="invalid_token")
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Forbidden")
        if resp.status_code >= 500:
            raise HTTPException(status_code=503, detail="Authentication service unavailable")
        if resp.status_code != 200:
            raise HTTPException(status_code=503, detail="Authentication service error")

        data: dict[str, Any] = resp.json()
        user_status = str(data.get("user_status") or "").upper()
        membership_status = str(data.get("membership_status") or "").upper()

        if user_status != "ACTIVE" or membership_status != "ACTIVE":
            raise HTTPException(status_code=403, detail="Inactive user or membership")

        ctx = ActorContext(
            user_id=str(data.get("user_id") or data.get("sub") or ""),
            active_tenant_id=str(data.get("active_tenant_id") or ""),
            scoped_roles=list(data.get("scoped_roles") or []),
            permissions=list(data.get("permissions") or []),
        )

        if not ctx.user_id or not ctx.active_tenant_id:
            raise HTTPException(status_code=503, detail="Authentication service returned incomplete context")

        if ttl > 0:
            _UVMV_CACHE[key] = (now + ttl, ctx)

        request.state.actor_context = ctx
        return ctx


    raise HTTPException(status_code=501, detail="Auth disabled; enable FEATURE_JWT_AUTH")
