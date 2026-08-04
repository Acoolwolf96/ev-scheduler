from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.scheduling import (
    pick_cheapest_hours,
    calculate_baseline_cost,
    calculate_optimized_cost,
)

router = APIRouter(prefix="/charging-requests", tags=["charging-requests"])


@router.post("/", response_model=schemas.ChargingRequestOut)
def create_charging_request(req: schemas.ChargingRequestCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    available_prices = (
        db.query(models.Price)
        .filter(models.Price.timestamp >= now, models.Price.timestamp <= req.deadline)
        .all()
    )

    if len(available_prices) < req.hours_needed:
        raise HTTPException(
            status_code=404,
            detail="Not enough price data between now and the deadline",
        )

    chosen_hours = pick_cheapest_hours(available_prices, req.hours_needed)
    baseline = calculate_baseline_cost(available_prices, req.hours_needed, req.charger_power_kw)
    optimized = calculate_optimized_cost(chosen_hours, req.charger_power_kw)

    db_request = models.ChargingRequest(
        hours_needed=req.hours_needed,
        deadline=req.deadline,
        charger_power_kw=req.charger_power_kw,
        baseline_cost=baseline,
        optimized_cost=optimized,
    )
    db.add(db_request)
    db.flush()  # assigns db_request.id without fully committing yet

    for price in chosen_hours:
        db.add(models.ScheduledHour(charging_request_id=db_request.id, price_id=price.id))

    db.commit()
    db.refresh(db_request)
    return db_request


@router.get("/", response_model=List[schemas.ChargingRequestOut])
def list_charging_requests(db: Session = Depends(get_db)):
    return db.query(models.ChargingRequest).all()
