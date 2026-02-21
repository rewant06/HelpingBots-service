
import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from main import app


def _valid_contract() -> dict:
    return {
        "contractVersion": "1",
        "issuer": "http://localhost:8000",
        "audiences": ["drreach-api"],
        "jwksUri": "http://localhost:8000/.well-known/jwks.json",
        "jwt": {
            "alg": "RS256",
            "requiredClaims": ["sub", "exp", "iss", "aud"],
            "actorContext": {"user_id": "sub", "active_tenant_id": "active_tenant_id"},
        },
        "roleToPerms": {"version": "1"},
    }


class _MockResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def json(self) -> dict:
        return self._payload

@pytest.mark.asyncio
async def test_authz_version_200_ok(monkeypatch):
    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url: str):
            return _MockResponse(200, _valid_contract())

    import app.api.authz as authz_module

    monkeypatch.setattr(authz_module.httpx, "AsyncClient", MockAsyncClient)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/authz/version")

    assert resp.status_code == 200
    assert resp.headers.get("x-correlation-id")
    body = resp.json()
    assert "contractVersion" in body
    assert "issuer" in body
    assert "audiences" in body
    assert "jwksUri" in body


@pytest.mark.asyncio
async def test_authz_version_timeout_503(monkeypatch):
    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url: str):
            raise httpx.TimeoutException("timeout")

    import app.api.authz as authz_module

    monkeypatch.setattr(authz_module.httpx, "AsyncClient", MockAsyncClient)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/authz/version")

    assert resp.status_code == 503
    assert resp.headers.get("x-correlation-id")
    body = resp.json()
    assert set(["error", "message", "correlation_id"]).issubset(body.keys())


@pytest.mark.asyncio
async def test_authz_version_request_error_503(monkeypatch):
    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url: str):
            req = httpx.Request("GET", url)
            raise httpx.RequestError("unavailable", request=req)

    import app.api.authz as authz_module

    monkeypatch.setattr(authz_module.httpx, "AsyncClient", MockAsyncClient)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/authz/version")

    assert resp.status_code == 503
    assert resp.headers.get("x-correlation-id")


@pytest.mark.asyncio
async def test_authz_version_non_200_503(monkeypatch):
    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
           return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url: str):
            return _MockResponse(500, {"error": "iam_error"})

    import app.api.authz as authz_module

    monkeypatch.setattr(authz_module.httpx, "AsyncClient", MockAsyncClient)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/authz/version")

    assert resp.status_code == 503
    assert resp.headers.get("x-correlation-id")


@pytest.mark.asyncio
async def test_authz_version_invalid_contract_503(monkeypatch):
    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url: str):
            return _MockResponse(200, {"not": "a-contract"})

    import app.api.authz as authz_module

    monkeypatch.setattr(authz_module.httpx, "AsyncClient", MockAsyncClient)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/authz/version")

    assert resp.status_code == 503
    assert resp.headers.get("x-correlation-id")
