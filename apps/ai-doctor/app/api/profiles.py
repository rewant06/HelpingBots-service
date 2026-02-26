from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response
import json
import logging
from app.api.schemas.profile import ProfileCreateRequest, ProfileResponse
from app.core.auth.iam_uvmv import require_actor_context


router = APIRouter(
    prefix="/v1",
    tags=["profiles"],
    dependencies=[Depends(require_actor_context)],
)


def _to_jsonb(value) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)

def _pool_or_503(request: Request):
    if getattr(request.app.state, "db_init_failed", False):
        raise HTTPException(status_code=503, detail="Database initialization failed")
    pool = getattr(request.app.state, "db_pool", None)
    if pool is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    return pool


def _cid(request: Request):
    return getattr(request.state, "correlation_id", None)


def _record_to_profile(row: Any) -> ProfileResponse:
    return ProfileResponse(
        id=str(row["id"]),
        tenant_id=str(row["tenant_id"]),
        iam_user_id=str(row["iam_user_id"]),
        dob=row["dob"],
        sex=row["sex"],
        weight_kg=row["weight_kg"],
        height_cm=row["height_cm"],
        blood_type=row["blood_type"],
        timezone=row["timezone"],
        preference_mode=row["preference_mode"],
        created_at=row["created_at"],
    )


@router.post("/profiles", response_model=ProfileResponse)
async def create_profile(
    request: Request,
    response: Response,
    payload: ProfileCreateRequest | None = Body(default=None),
    actor=Depends(require_actor_context),
) -> ProfileResponse:
    pool = _pool_or_503(request)
    payload = payload or ProfileCreateRequest()

    tenant_id = actor.active_tenant_id
    iam_user_id = actor.user_id
    roles = list(getattr(actor, "scoped_roles", []) or [])

    async with pool.acquire() as conn:
        async with conn.transaction():
            created_row = await conn.fetchrow(
                """
                insert into drreach.profiles (
                  tenant_id,
                  iam_user_id,
                  dob,
                  sex,
                  weight_kg,
                  height_cm,
                  blood_type,
                  timezone,
                  preference_mode
                ) values ($1,$2,$3,$4,$5,$6,$7,coalesce($8,'UTC'),coalesce($9,'integrated'))
                on conflict (tenant_id, iam_user_id) where deleted_at is null
                do nothing
                returning *
                """,
                tenant_id,
                iam_user_id,
                payload.dob,
                payload.sex,
                payload.weight_kg,
                payload.height_cm,
                payload.blood_type,
                payload.timezone,
                payload.preference_mode,
            )

            if created_row is not None:
                row = created_row
                created = True
            else:
                row = await conn.fetchrow(
                    """
                    select *
                    from drreach.profiles
                    where tenant_id=$1 and iam_user_id=$2 and deleted_at is null
                    limit 1
                    """,
                    tenant_id,
                    iam_user_id,
                )
                if row is None:
                    raise HTTPException(status_code=503, detail="Profile creation failed")
                created = False

            await conn.execute(
                """
                insert into drreach.audit_logs(
                  tenant_id,
                  actor_iam_user_id,
                  actor_roles,
                  actor_snapshot,
                  event_type,
                  entity_type,
                  entity_id,
                  correlation_id,
                  evidence
                )  values ($1,$2,$3::text[],$4::jsonb,$5,$6,$7,$8,$9::jsonb)
                """,
                tenant_id,
                iam_user_id,
                roles,
                _to_jsonb({"user_id": iam_user_id, "active_tenant_id": tenant_id, "roles": roles}),
                "profile.create",
                "profile",
                row["id"],
                _cid(request),
                _to_jsonb ({"result": "created" if created else "existing"}),
            )

    response.status_code = 201 if created else 200
    return _record_to_profile(row)


@router.get("/profiles/me", response_model=ProfileResponse)
async def get_my_profile(
    request: Request,
    actor=Depends(require_actor_context),
) -> ProfileResponse:
    pool = _pool_or_503(request)

    tenant_id = actor.active_tenant_id
    iam_user_id = actor.user_id

    # async with pool.acquire() as conn:
    #     async with conn.transaction():
    #         row = await conn.fetchrow(
    #             """
    #             select *
    #             from drreach.profiles
    #             where tenant_id=$1 and iam_user_id=$2 and deleted_at is null
    #             limit 1
    #             """,
    #             tenant_id,
    #             iam_user_id,
    #         )
    #         if row is None:
    #             raise HTTPException(status_code=404, detail="Profile not found")

    #         ip = request.client.host if request.client else None

    #         await conn.execute(
    #             """
    #             insert into drreach.access_logs(
    #               tenant_id,
    #               actor_iam_user_id,
    #               resource_type,
    #               resource_id,
    #               action,
    #               ip_address
    #             ) values ($1,$2,$3,$4,$5,$6)
    #             """,
    #             tenant_id,
    #             iam_user_id,
    #             "profile",
    #             row["id"],
    #             "profile.read.me",
    #             ip,
    #         )
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            select *
            from drreach.profiles
            where tenant_id=$1 and iam_user_id=$2 and deleted_at is null
            limit 1
            """,
            tenant_id,
            iam_user_id,
        )
        if row is None:
            raise HTTPException(status_code=404, detail="Profile not found")

        ip = request.client.host if request.client else None
        try:
            await conn.execute(
                """
                insert into drreach.access_logs(
                  tenant_id,
                  actor_iam_user_id,
                  resource_type,
                  resource_id,
                  action,
                  ip_address
                ) values ($1,$2,$3,$4,$5,$6)
                """,
                tenant_id,
                iam_user_id,
                "profile",
                row["id"],
                "profile.read.me",
                ip,
            )
        except Exception as e:
            # Best-effort: do not fail the read path due to logging issues.
            logging.getLogger(__name__).warning(
                "access_log_insert_failed: %s cid=%s",
                type(e).__name__,
                _cid(request),
            )
 

    return _record_to_profile(row)
