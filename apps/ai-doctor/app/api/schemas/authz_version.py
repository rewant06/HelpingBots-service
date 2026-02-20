from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class JwtContract(BaseModel):
    model_config = ConfigDict(extra="forbid")
    alg: str
    requiredClaims: list[str]
    actorContext: dict[str, str]


class RoleToPermsContract(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: str


class AuthzVersionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    contractVersion: str
    issuer: str
    audiences: list[str]
    jwksUri: str
    jwt: JwtContract
    roleToPerms: RoleToPermsContract
