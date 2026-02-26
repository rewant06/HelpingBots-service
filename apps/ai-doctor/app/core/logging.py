from __future__ import annotations

import json
import logging

_SENSITIVE_LOG_KEYS = {
    "password",
    "passwd",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "api_key",
    "apikey",
    "database_url",
    "dsn",
}


class RedactJsonFilter(logging.Filter):
    def __init__(self, keys: set[str]) -> None:
        super().__init__()
        self.keys = {k.lower() for k in keys}

    def filter(self, record: logging.LogRecord) -> bool:
        if not isinstance(record.msg, str):
            return True
        try:
            data = json.loads(record.msg)
        except Exception:
            return True
        if not isinstance(data, dict):
            return True

        changed = False
        for k in list(data.keys()):
            if str(k).lower() in self.keys:
                data[k] = "[REDACTED]"
                changed = True

        if changed:
            record.msg = json.dumps(data, separators=(",", ":"))
            record.args = ()
        return True


def get_request_logger() -> logging.Logger:
    logger = logging.getLogger("app.request")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        h = logging.StreamHandler()
        h.setFormatter(logging.Formatter("%(message)s"))
        h.addFilter(RedactJsonFilter(_SENSITIVE_LOG_KEYS))
        logger.addHandler(h)
        logger.propagate = False
    return logger


get_request_logger()
