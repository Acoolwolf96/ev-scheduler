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


class ChargingRequestOut(BaseModel):
    id: int
    hours_needed: int
    deadline: datetime
    charger_power_kw: float
    baseline_cost: float
    optimized_cost: float
    created_at: datetime
    scheduled_hours: List[ScheduledHourOut] = []

    class Config:
        from_attributes = True
