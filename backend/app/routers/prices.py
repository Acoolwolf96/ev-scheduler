from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("/today", response_model=schemas.TodayPricesOut)
def get_todays_prices(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(hours=24)

    prices = (
        db.query(models.Price)
        .filter(models.Price.timestamp >= now, models.Price.timestamp <= window_end)
        .order_by(models.Price.timestamp)
        .all()
    )

    cheapest = min(prices, key=lambda p: p.price_eur_kwh) if prices else None

    return schemas.TodayPricesOut(prices=prices, cheapest=cheapest)
