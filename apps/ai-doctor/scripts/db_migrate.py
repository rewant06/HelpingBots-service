import asyncio
import hashlib
import os
from pathlib import Path
from urllib.parse import urlparse

import asyncpg
from dotenv import load_dotenv, find_dotenv

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT / "app" / "db" / "migrations"


def _sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


async def main() -> None:
    load_dotenv(find_dotenv(), override=False)
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is required")
    u = urlparse(dsn)
    host = (u.hostname or "").lower()
    # Supabase requires SSL; asyncpg expects ssl=... rather than sslmode=...
    ssl_arg = "require" if host.endswith(".supabase.co") or host.endswith(".supabase.com") else None

    files = sorted(p for p in MIGRATIONS_DIR.glob("*.sql") if p.name[:4].isdigit())
    if not files:
        raise SystemExit(f"No migrations found in {MIGRATIONS_DIR}")

    conn = await asyncpg.connect(dsn, ssl=ssl_arg)
    try:
        await conn.execute("create schema if not exists drreach;")
        await conn.execute(
            """
            create table if not exists drreach.schema_migrations (
              filename text primary key,
              sha256 text not null,
              applied_at timestamptz not null default now()
            );
            """
        )

        for path in files:
            sql = path.read_text(encoding="utf-8")
            sha = _sha256_text(sql)

            row = await conn.fetchrow(
                "select filename, sha256 from drreach.schema_migrations where filename=$1",
                path.name,
            )
            if row:
                if row["sha256"] != sha:
                    raise SystemExit(f"Migration changed after apply: {path.name}")
                continue

            await conn.execute(sql)
            await conn.execute(
                "insert into drreach.schema_migrations(filename, sha256) values ($1,$2)",
                path.name,
                sha,
            )

        print(f"Applied ok. Count={len(files)}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
