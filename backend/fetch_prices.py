import os
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

from app.database import SessionLocal
from app.models import Price

load_dotenv()

ENTSOE_TOKEN = os.getenv("ENTSOE_TOKEN", "")
ENTSOE_URL = "https://web-api.tp.entsoe.eu/api"
FINLAND_DOMAIN = "10YFI-1--------U"
NAMESPACE = {"ns": "urn:iec62325.351:tc57wg16:451-3:publicationdocument:7:3"}


def fetch_day_ahead_prices():
    if not ENTSOE_TOKEN:
        raise RuntimeError("ENTSOE_TOKEN not set in .env")

    now = datetime.now(timezone.utc)
    period_start = now.strftime("%Y%m%d0000")
    period_end = (now + timedelta(days=2)).strftime("%Y%m%d0000")

    params = {
        "securityToken": ENTSOE_TOKEN,
        "documentType": "A44",
        "in_Domain": FINLAND_DOMAIN,
        "out_Domain": FINLAND_DOMAIN,
        "periodStart": period_start,
        "periodEnd": period_end,
    }

    response = requests.get(ENTSOE_URL, params=params, timeout=30)
    response.raise_for_status()

    root = ET.fromstring(response.content)
    db = SessionLocal()
    inserted, updated = 0, 0
    try:
        for timeseries in root.findall(".//ns:TimeSeries", NAMESPACE):
            period = timeseries.find("ns:Period", NAMESPACE)
            start_str = period.find("ns:timeInterval/ns:start", NAMESPACE).text
            start = datetime.strptime(start_str, "%Y-%m-%dT%H:%MZ")

            for point in period.findall("ns:Point", NAMESPACE):
                position = int(point.find("ns:position", NAMESPACE).text)
                price_eur_mwh = float(point.find("ns:price.amount", NAMESPACE).text)
                price_eur_kwh = price_eur_mwh / 1000
                timestamp = start + timedelta(hours=position - 1)

                existing = db.query(Price).filter(Price.timestamp == timestamp).first()
                if existing:
                    existing.price_eur_kwh = price_eur_kwh
                    updated += 1
                else:
                    db.add(Price(timestamp=timestamp, price_eur_kwh=price_eur_kwh))
                    inserted += 1
        db.commit()
        print(f"Done. Inserted {inserted}, updated {updated}.")
    finally:
        db.close()


if __name__ == "__main__":
    fetch_day_ahead_prices()
