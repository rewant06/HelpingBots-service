from __future__ import annotations

# Compatibility entrypoint during refactor:
# today: app.main -> imports app from root main.py
# later: root main.py can become the shim and app.main becomes the real app factory.
from main import app  # noqa: F401
