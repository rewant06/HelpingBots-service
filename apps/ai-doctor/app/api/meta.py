from __future__ import annotations

import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict

FEATURE_DEV_AUTH_ENV = "FEATURE_DEV_AUTH"
FEATURE_JWT_AUTH_ENV = "FEATURE_JWT_AUTH"

router = APIRouter(tags=["meta"])


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


@router.get("/authz/version", response_model=VersionCheckResponse, tags=["authz"])
async def authz_version(request: Request) -> VersionCheckResponse:
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


@router.get("/v1/meta", response_model=MetaResponse)
async def meta() -> MetaResponse:
    return MetaResponse(
        version=os.getenv("SERVICE_VERSION", "1.0.0"),
        environment=os.getenv("ENV", "dev"),
        features={
            "dev_auth": _feature_enabled(FEATURE_DEV_AUTH_ENV),
            "jwt_auth": _feature_enabled(FEATURE_JWT_AUTH_ENV),
        },
    )
