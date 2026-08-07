import os
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

FINGRID_API_KEY = os.getenv("FINGRID_API_KEY", "")
FINGRID_URL = "https://data.fingrid.fi/api/datasets/265/data"


def get_current_emission_factor() -> tuple[datetime, float] | None:
    """Return the most recent real-time carbon intensity reading for
    Finland's consumed electricity, in gCO2/kWh. Purely informational —
    Fingrid only publishes real-time data here, no forecast, so this can
    never be used to pick a *future* hour, only to show the current one.
    Returns None on any failure, same fail-open pattern as weather.py."""
    if not FINGRID_API_KEY:
        return None

    now = datetime.now(timezone.utc)
    start = now - timedelta(minutes=30)

    params = {
        "startTime": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endTime": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "format": "json",
    }
    headers = {"x-api-key": FINGRID_API_KEY}

    try:
        response = requests.get(FINGRID_URL, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        rows = response.json().get("data", [])
        if not rows:
            return None

        latest = max(rows, key=lambda r: r["startTime"])
        timestamp = datetime.strptime(latest["startTime"], "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc)
        return timestamp, float(latest["value"])
    except Exception:
        return None
