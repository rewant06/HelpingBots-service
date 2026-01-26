from __future__ import annotations

import asyncpg
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str


@router.get("/healthz", response_model=HealthResponse)
async def healthz() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/readyz", response_model=HealthResponse)
async def readyz(request: Request) -> HealthResponse:
    db_init_failed: bool = getattr(request.app.state, "db_init_failed", False)
    db_pool: asyncpg.Pool | None = getattr(request.app.state, "db_pool", None)

    if db_init_failed:
        raise HTTPException(status_code=503, detail="Database not ready")

    if db_pool is not None:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("SELECT 1")
        except Exception:
            raise HTTPException(status_code=503, detail="database not ready")

    return HealthResponse(status="ok")
