from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.scheduling import (
    pick_cheapest_hours,
    calculate_baseline_cost,
    calculate_optimized_cost,
    calculate_hours_needed,
    pick_cheapest_window,
)
from app.weather import get_forecast_low, get_forecast_temp_range

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
    db.flush()

    for price in chosen_hours:
        db.add(models.ScheduledHour(charging_request_id=db_request.id, price_id=price.id))

    db.commit()
    db.refresh(db_request)
    return db_request


@router.post("/optimize", response_model=schemas.ChargingRequestOut)
def optimize_charging(req: schemas.OptimizeChargeRequest, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    forecast_low_temp_c = None
    weather = get_forecast_low(req.place)
    if weather:
        _, forecast_low_temp_c = weather

    hours_needed = calculate_hours_needed(
        current_charge_percent=req.current_charge_percent,
        target_charge_percent=req.target_charge_percent,
        battery_capacity_kwh=req.battery_capacity_kwh,
        charger_power_kw=req.charger_power_kw,
        forecast_low_temp_c=forecast_low_temp_c,
    )

    available_prices = (
        db.query(models.Price)
        .filter(models.Price.timestamp >= now, models.Price.timestamp <= req.departure_time)
        .order_by(models.Price.timestamp)
        .all()
    )

    if len(available_prices) < hours_needed:
        raise HTTPException(status_code=404, detail="Not enough price data between now and departure time")

    window = pick_cheapest_window(available_prices, hours_needed)

    if window:
        actual_temp = get_forecast_temp_range(window[0].timestamp, window[-1].timestamp, req.place)
        if actual_temp is not None and actual_temp != forecast_low_temp_c:
            forecast_low_temp_c = actual_temp
            hours_needed = calculate_hours_needed(
                current_charge_percent=req.current_charge_percent,
                target_charge_percent=req.target_charge_percent,
                battery_capacity_kwh=req.battery_capacity_kwh,
                charger_power_kw=req.charger_power_kw,
                forecast_low_temp_c=forecast_low_temp_c,
            )
            if len(available_prices) >= hours_needed:
                window = pick_cheapest_window(available_prices, hours_needed)

    baseline_cost = calculate_baseline_cost(available_prices, hours_needed, req.charger_power_kw)
    optimized_cost = calculate_optimized_cost(window, req.charger_power_kw)

    db_request = models.ChargingRequest(
        hours_needed=hours_needed,
        deadline=req.departure_time,
        charger_power_kw=req.charger_power_kw,
        baseline_cost=baseline_cost,
        optimized_cost=optimized_cost,
        current_charge_percent=req.current_charge_percent,
        target_charge_percent=req.target_charge_percent,
        battery_capacity_kwh=req.battery_capacity_kwh,
        forecast_low_temp_c=forecast_low_temp_c,
        start_time=window[0].timestamp,
        finish_time=window[-1].timestamp,
    )
    db.add(db_request)
    db.flush()

    for price in window:
        db.add(models.ScheduledHour(charging_request_id=db_request.id, price_id=price.id))

    db.commit()
    db.refresh(db_request)
    return db_request


@router.get("/summary", response_model=List[schemas.PeriodSummaryOut])
def get_savings_summary(group_by: str = "month", db: Session = Depends(get_db)):
    if group_by not in ("day", "week", "month", "year"):
        raise HTTPException(status_code=400, detail="group_by must be one of: day, week, month, year")

    period = func.date_trunc(group_by, models.ChargingRequest.created_at).label("period_start")

    rows = (
        db.query(
            period,
            func.sum(models.ChargingRequest.baseline_cost).label("total_baseline"),
            func.sum(models.ChargingRequest.optimized_cost).label("total_optimized"),
            func.count(models.ChargingRequest.id).label("request_count"),
        )
        .group_by(period)
        .order_by(period.desc())
        .all()
    )

    return [
        schemas.PeriodSummaryOut(
            period_start=row.period_start,
            total_baseline=float(row.total_baseline),
            total_optimized=float(row.total_optimized),
            total_saved=float(row.total_baseline) - float(row.total_optimized),
            request_count=row.request_count,
        )
        for row in rows
    ]


@router.get("/", response_model=List[schemas.ChargingRequestOut])
def list_charging_requests(db: Session = Depends(get_db)):
    return db.query(models.ChargingRequest).all()
