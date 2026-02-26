import pytest


def pytest_configure(config):
    # Register marker to avoid PytestUnknownMarkWarning
    config.addinivalue_line(
        "markers",
        "integration: tests that require DATABASE_URL / real DB",
    )

    # Load .env only for integration runs (so unit tests don't accidentally pick up secrets)
    markexpr = getattr(config.option, "markexpr", "") or ""
    if "integration" in markexpr:
        try:
            from dotenv import load_dotenv

            load_dotenv(override=False)
        except Exception:
            # If dotenv load fails, tests will skip based on missing DATABASE_URL
            pass
