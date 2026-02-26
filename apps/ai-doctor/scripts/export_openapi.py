import json
from pathlib import Path

from main import app


def main() -> None:
    out = Path("openapi.json")
    out.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True), encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
