from __future__ import annotations
from app.core.auth.iam_uvmv import require_actor_context

import os
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, ValidationError

from app.core.auth.iam_uvmv import require_actor_context
from app.api.schemas.authz_version import AuthzVersionResponse

FEATURE_DEV_AUTH_ENV = "FEATURE_DEV_AUTH"
FEATURE_JWT_AUTH_ENV = "FEATURE_JWT_AUTH"
IAM_SERVICE_URL_ENV = "IAM_SERVICE_URL"

router = APIRouter(tags=["meta"])
v1_router = APIRouter(prefix="/v1", tags=["meta"], dependencies=[Depends(require_actor_context)])


class MetaResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: str
    environment: str
    features: dict[str, bool]


def _feature_enabled(name: str) -> bool:
    return os.getenv(name, "false").strip().lower() == "true"

def _iam_base_url() -> str:
    return (os.getenv(IAM_SERVICE_URL_ENV) or "http://localhost:8000").rstrip("/")


@router.get("/authz/version", response_model=AuthzVersionResponse, tags=["authz"])
async def authz_version() -> AuthzVersionResponse:
    url = f"{_iam_base_url()}/authz/version"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Authentication service timeout")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")

    if resp.status_code != 200:
        raise HTTPException(status_code=503, detail="Authentication service error")

    try:
        return AuthzVersionResponse.model_validate(resp.json())
    except ValidationError:
        raise HTTPException(status_code=503, detail="Authentication service returned invalid contract")



@v1_router.get("/meta", response_model=MetaResponse)
async def meta() -> MetaResponse:
    return MetaResponse(
        version=os.getenv("SERVICE_VERSION", "1.0.0"),
        environment=os.getenv("ENV", "dev"),
        features={
            "dev_auth": _feature_enabled(FEATURE_DEV_AUTH_ENV),
            "jwt_auth": _feature_enabled(FEATURE_JWT_AUTH_ENV),
        },
    )
