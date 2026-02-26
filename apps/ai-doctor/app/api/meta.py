from __future__ import annotations

import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
 
from app.core.auth.iam_uvmv import require_actor_context


FEATURE_JWT_AUTH_ENV = "FEATURE_JWT_AUTH"


router = APIRouter(tags=["meta"])
v1_router = APIRouter(prefix="/v1", tags=["meta"], dependencies=[Depends(require_actor_context)])


class MetaResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: str
    environment: str
    features: dict[str, bool]


def _feature_enabled(name: str) -> bool:
    return os.getenv(name, "false").strip().lower() == "true"


@v1_router.get("/meta", response_model=MetaResponse)
async def meta() -> MetaResponse:
    return MetaResponse(
        version=os.getenv("SERVICE_VERSION", "1.0.0"),
        environment=os.getenv("ENV", "dev"),
        features={
            "jwt_auth": _feature_enabled(FEATURE_JWT_AUTH_ENV),
        },
    )
