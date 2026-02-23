import os
import uuid

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from app.core.auth.iam_uvmv import require_actor_context
from app.core.auth.models import ActorContext
from main import create_app


@pytest.mark.integration
def test_get_profiles_me_missing_returns_404_and_correlation_header():
    if not os.getenv("DATABASE_URL"):
        pytest.skip("DATABASE_URL not set")

    app = create_app()

    # Random identifiers so the profile is absent without mutating existing data.
    tenant_id = f"t_test_{uuid.uuid4().hex}"
    user_id = f"u_test_{uuid.uuid4().hex}"

    async def _actor_override(request: Request) -> ActorContext:
        return ActorContext(
            user_id=user_id,
            active_tenant_id=tenant_id,
            scoped_roles=[],
            permissions=[],
        )

    app.dependency_overrides[require_actor_context] = _actor_override

    with TestClient(app) as client:
        resp = client.get("/v1/profiles/me")

    assert resp.status_code == 404
    body = resp.json()
    assert body["error"] == "http_error"
    assert "message" in body
    assert "correlation_id" in body
    assert resp.headers.get("X-Correlation-Id")
