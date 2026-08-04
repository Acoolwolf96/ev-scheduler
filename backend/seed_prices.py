from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models import Price

db = SessionLocal()

start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

# A made-up 24-hour price curve — cheap overnight, expensive in the evening,
# same shape as real day-ahead pricing tends to follow.
sample_prices = [
    0.31, 0.29, 0.27, 0.25, 0.22, 0.18, 0.15, 0.08,
    0.06, 0.05, 0.07, 0.12, 0.20, 0.28, 0.33, 0.35,
    0.30, 0.26, 0.19, 0.10, 0.06, 0.05, 0.09, 0.14,
]

for i, price in enumerate(sample_prices):
    ts = start + timedelta(hours=i)
    if not db.query(Price).filter(Price.timestamp == ts).first():
        db.add(Price(timestamp=ts, price_eur_kwh=price))

db.commit()
print(f"Seeded {len(sample_prices)} hourly prices starting {start.isoformat()}")
db.close()
