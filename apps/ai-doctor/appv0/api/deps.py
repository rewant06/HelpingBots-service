import os
import time
import httpx
from fastapi import Header, HTTPException, status
from pydantic import BaseModel

# Configuration
IAM_SERVICE_URL = os.getenv("IAM_SERVICE_URL", "http://localhost:8000") # Default to local for testing
CACHE_TTL_SECONDS = 60

# Simple In-Memory Cache for Phase 1
# format: {api_key: (timestamp, tenant_context)}
_key_cache = {}

class TenantContext(BaseModel):
    tenantId: str
    keyId: str
    scopes: list[str]

async def verify_api_key(
    x_api_key: str = Header(..., description="Project API Key"),
    x_user_id: str = Header(..., description="Real User ID")
) -> dict:
    """
    Dependency that mimics the NestJS ApiKeyGuard.
    1. Checks headers.
    2. Checks local cache.
    3. Verifies with IAM Service.
    4. returns the Context (Tenant + User).
    """
    
    # 1. Validation: Headers existence (handled by FastAPI default ...)
    if not x_api_key or not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing x-api-key or x-user-id header"
        )

    # 2. Cache Lookup
    cached = _key_cache.get(x_api_key)
    if cached:
        timestamp, context = cached
        if time.time() - timestamp < CACHE_TTL_SECONDS:
            return {**context, "user_id": x_user_id}
        else:
            # Expired
            del _key_cache[x_api_key]

    # 3. Remote Verification (Call IAM Service)
    verify_url = f"{IAM_SERVICE_URL}/internal/api-keys/verify"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                verify_url,
                json={"apiKey": x_api_key},
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # 4. Update Cache
                tenant_context = {
                    "tenant_id": data["tenantId"],
                    "key_id": data["keyId"],
                    "scopes": data["scopes"]
                }
                _key_cache[x_api_key] = (time.time(), tenant_context)
                
                # Return combined context
                return {**tenant_context, "user_id": x_user_id}
                
            elif response.status_code in [401, 403]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="Invalid or Expired API Key"
                )
            else:
                print(f"IAM Error: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="IAM Verification Failed"
                )

        except httpx.RequestError as e:
            # Network error (IAM is down)
            print(f"IAM Connection Failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication Service Unavailable"
            )