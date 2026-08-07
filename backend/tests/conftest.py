from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import Price

TEST_DATABASE_URL = "postgresql://scheduler:scheduler@localhost:5432/scheduler_test"

engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def mock_weather(monkeypatch):
    """Applied automatically to every test — replaces the real FMI calls
    with instant fakes, so tests don't depend on an external service."""
    monkeypatch.setattr("app.routers.charging_requests.get_forecast_low", lambda place: None)
    monkeypatch.setattr("app.routers.charging_requests.get_forecast_temp_range", lambda start, end, place: None)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestSessionLocal()

    # Same 24h price shape as seed_prices.py, starting from the next hour,
    # so every test has predictable, known prices to optimize against.
    start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    sample_prices = [
        0.31, 0.29, 0.27, 0.25, 0.22, 0.18, 0.15, 0.08,
        0.06, 0.05, 0.07, 0.12, 0.20, 0.28, 0.33, 0.35,
        0.30, 0.26, 0.19, 0.10, 0.06, 0.05, 0.09, 0.14,
    ]
    for i, price in enumerate(sample_prices):
        session.add(Price(timestamp=start + timedelta(hours=i), price_eur_kwh=price))
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    return TestClient(app)
