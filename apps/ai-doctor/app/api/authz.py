from __future__ import annotations

import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.api.schemas.authz_version import AuthzVersionResponse


IAM_SERVICE_URL_ENV = "IAM_SERVICE_URL"

router = APIRouter(tags=["authz"])


def _iam_base_url() -> str:
    return (os.getenv(IAM_SERVICE_URL_ENV) or "http://localhost:8000").rstrip("/")


@router.get("/authz/version", response_model=AuthzVersionResponse)
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