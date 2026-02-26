from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from urllib.parse import urlparse

import asyncpg
from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.authz import router as authz_router
from app.api.meta import router as meta_router
from app.api.meta import v1_router as v1_router
from app.api.profiles import router as profiles_router
from app.core.errors import register_exception_handlers
from app.core.middleware import (
    CorrelationIdMiddleware,
    RequestLogMiddleware,
    RequestSizeLimitMiddleware,
    SecurityHeadersMiddleware,
    TrustedHostsMiddleware,
    max_request_bytes,
    trusted_hosts,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    dsn = os.getenv("DATABASE_URL")

    if not dsn:
        app.state.db_pool = None
        app.state.db_init_failed = False
    else:
        try:
            # u = urlparse(dsn)
            # app.state.db_pool = await asyncpg.create_pool(
            #     host=u.hostname,
            #     port=u.port or 5432,
            #     user=u.username,
            #     password=u.password,
            #     database=(u.path or "/postgres").lstrip("/"),
            #     min_size=1,
            #     max_size=5,
            #     ssl="require",
            # )
            # Supabase pooler (6543) typically runs transaction pooling, which does not
            # support prepared statements; asyncpg should disable statement cache.
            dsn_clean = dsn.strip()
            if len(dsn_clean) >= 2 and dsn_clean[0] == dsn_clean[-1] and dsn_clean[0] in ("'", '"'):
                dsn_clean = dsn_clean[1:-1]

            app.state.db_pool = await asyncpg.create_pool(
                dsn=dsn_clean,
                min_size=1,
                max_size=5,
                ssl="require",
                statement_cache_size=0,
            )
            app.state.db_init_failed = False
        except Exception as e:
            logging.getLogger(__name__).warning("db_pool_init_failed: %s", type(e).__name__)
            app.state.db_pool = None
            app.state.db_init_failed = True

    yield

    pool = getattr(app.state, "db_pool", None)
    if pool is not None:
        await pool.close()

    app.state.db_pool = None
    app.state.db_init_failed = False


def create_app() -> FastAPI:
    app = FastAPI(
        title="Dr. Reach API",
        version="1.0.0",
        lifespan=lifespan,
    )

    # Middleware (cross-cutting)
    app.add_middleware(CorrelationIdMiddleware)
    app.add_middleware(RequestSizeLimitMiddleware, max_bytes=max_request_bytes())
    app.add_middleware(SecurityHeadersMiddleware)

    _allowed_hosts = trusted_hosts()
    if _allowed_hosts:
        app.add_middleware(TrustedHostsMiddleware, allowed_hosts=_allowed_hosts)

    # Log all requests (add last so it wraps everything)
    app.add_middleware(RequestLogMiddleware)

    # Routers
    app.include_router(health_router)
    app.include_router(authz_router)
    app.include_router(meta_router)
    app.include_router(v1_router)
    app.include_router(profiles_router)
    register_exception_handlers(app)

    return app


# Uvicorn entrypoint
app = create_app()
