from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


Sex = Literal["male", "female", "intersex"]
BloodType = Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


class ProfileCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dob: date | None = None
    sex: Sex | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
    blood_type: BloodType | None = None
    timezone: str | None = None
    preference_mode: str | None = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    tenant_id: str
    iam_user_id: str

    dob: date | None
    sex: str | None
    weight_kg: float | None
    height_cm: float | None
    blood_type: str | None
    timezone: str | None
    preference_mode: str | None

    created_at: datetime
