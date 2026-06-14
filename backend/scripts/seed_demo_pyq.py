from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.database import SessionLocal
from app.services.demo_pyq_seed import seed_demo_pyq_data


def main() -> None:
    db = SessionLocal()
    try:
        result = seed_demo_pyq_data(db)
        print(result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
