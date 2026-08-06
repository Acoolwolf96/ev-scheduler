from datetime import datetime
from typing import List
from pydantic import BaseModel


class PriceOut(BaseModel):
    timestamp: datetime
    price_eur_kwh: float

    class Config:
        from_attributes = True


class ScheduledHourOut(BaseModel):
    price: PriceOut

    class Config:
        from_attributes = True


class ChargingRequestCreate(BaseModel):
    hours_needed: int
    deadline: datetime
    charger_power_kw: float


class TodayPricesOut(BaseModel):
    prices: List[PriceOut]
    cheapest: PriceOut | None

class OptimizeChargeRequest(BaseModel):
    current_charge_percent: float
    target_charge_percent: float
    battery_capacity_kwh: float
    charger_power_kw: float
    departure_time: datetime
    place: str = "Helsinki"


class ChargingRequestOut(BaseModel):
    id: int
    hours_needed: int
    deadline: datetime
    charger_power_kw: float
    baseline_cost: float
    optimized_cost: float
    created_at: datetime
    scheduled_hours: List[ScheduledHourOut] = []
    current_charge_percent: float | None = None
    target_charge_percent: float | None = None
    battery_capacity_kwh: float | None = None
    forecast_low_temp_c: float | None = None
    start_time: datetime | None = None
    finish_time: datetime | None = None

    class Config:
        from_attributes = True
