from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import HTTPException, Request

from app.core.auth.models import ActorContext


IAM_SERVICE_URL_ENV = "IAM_SERVICE_URL"
FEATURE_DEV_AUTH_ENV = "FEATURE_DEV_AUTH"
FEATURE_JWT_AUTH_ENV = "FEATURE_JWT_AUTH"


def _feature_enabled(name: str) -> bool:
    return os.getenv(name, "false").strip().lower() == "true"


def _iam_base_url() -> str:
    return (os.getenv(IAM_SERVICE_URL_ENV) or "http://localhost:8000").rstrip("/")


def _extract_bearer_token(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization scheme")
    token = auth.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return token


def _get_dev_actor_from_headers(request: Request) -> ActorContext:
    user_id = request.headers.get("X-Debug-User-Id")
    tenant_id = request.headers.get("X-Debug-Tenant-Id")
    if not user_id or not tenant_id:
        raise HTTPException(status_code=401, detail="Missing X-Debug-User-Id or X-Debug-Tenant-Id")
    # Roles/permissions left empty in DEV mode for now; can be extended later.
    return ActorContext(user_id=user_id, active_tenant_id=tenant_id, scoped_roles=[], permissions=[])


async def require_actor_context(request: Request) -> ActorContext:
    # Precedence: JWT/IAM mode first, then DEV headers.
    if _feature_enabled(FEATURE_JWT_AUTH_ENV):
        token = _extract_bearer_token(request)
        url = f"{_iam_base_url()}/authz/uvmv/verify"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, headers={"Authorization": f"Bearer {token}"})
        except httpx.TimeoutException:
            raise HTTPException(status_code=503, detail="Authentication service timeout")
        except httpx.HTTPError:
            raise HTTPException(status_code=503, detail="Authentication service unavailable")

        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
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

        request.state.actor_context = ctx
        return ctx

    if _feature_enabled(FEATURE_DEV_AUTH_ENV):
        ctx = _get_dev_actor_from_headers(request)
        request.state.actor_context = ctx
        return ctx

    raise HTTPException(status_code=501, detail="Auth disabled; enable FEATURE_JWT_AUTH or FEATURE_DEV_AUTH")
