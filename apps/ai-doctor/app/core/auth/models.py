from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ActorContext(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: str
    active_tenant_id: str
    scoped_roles: list[str]
    permissions: list[str]
