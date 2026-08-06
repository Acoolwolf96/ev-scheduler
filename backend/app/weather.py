import xml.etree.ElementTree as ET
from datetime import datetime

import requests

FMI_URL = "http://opendata.fmi.fi/wfs"
NAMESPACE = {
    "wfs": "http://www.opengis.net/wfs/2.0",
    "BsWfs": "http://xml.fmi.fi/schema/wfs/2.0",
}


def get_forecast_low(place: str = "Tampere") -> tuple[datetime, float] | None:
    """Return the lowest forecast temperature over the next 24 hours for
    the given place, along with when it occurs. Returns None on any
    failure — weather is an enhancement, not a hard dependency."""
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "getFeature",
        "storedquery_id": "fmi::forecast::harmonie::surface::point::simple",
        "place": place,
        "parameters": "Temperature",
    }

    try:
        response = requests.get(FMI_URL, params=params, timeout=10)
        response.raise_for_status()

        root = ET.fromstring(response.content)
        readings = []

        for member in root.findall(".//wfs:member", NAMESPACE):
            time_str = member.find(".//BsWfs:Time", NAMESPACE).text
            value_str = member.find(".//BsWfs:ParameterValue", NAMESPACE).text
            timestamp = datetime.strptime(time_str, "%Y-%m-%dT%H:%M:%SZ")
            readings.append((timestamp, float(value_str)))

        if not readings:
            return None

        return min(readings[:24], key=lambda r: r[1])
    except Exception:
        return None
