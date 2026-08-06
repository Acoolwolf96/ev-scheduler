from sqlalchemy import Column, Integer, String, Numeric, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import relationship
from app.database import Base


class Price(Base):
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True)
    timestamp = Column(TIMESTAMP(timezone=True), unique=True, nullable=False)
    price_eur_kwh = Column(Numeric(6, 4), nullable=False)


class ChargingRequest(Base):
    __tablename__ = "charging_requests"

    id = Column(Integer, primary_key=True)
    hours_needed = Column(Integer, nullable=False)
    deadline = Column(TIMESTAMP(timezone=True), nullable=False)
    charger_power_kw = Column(Numeric(5, 2), nullable=False)
    baseline_cost = Column(Numeric(8, 2), nullable=False)
    optimized_cost = Column(Numeric(8, 2), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    current_charge_percent = Column(Numeric(5, 2), nullable=True)
    target_charge_percent = Column(Numeric(5, 2), nullable=True)
    battery_capacity_kwh = Column(Numeric(6, 2), nullable=True)
    forecast_low_temp_c = Column(Numeric(5, 2), nullable=True)
    start_time = Column(TIMESTAMP(timezone=True), nullable=True)
    finish_time = Column(TIMESTAMP(timezone=True), nullable=True)

    scheduled_hours = relationship("ScheduledHour", back_populates="request", cascade="all, delete-orphan")


class ScheduledHour(Base):
    __tablename__ = "scheduled_hours"

    id = Column(Integer, primary_key=True)
    charging_request_id = Column(Integer, ForeignKey("charging_requests.id", ondelete="CASCADE"), nullable=False)
    price_id = Column(Integer, ForeignKey("prices.id"), nullable=False)

    request = relationship("ChargingRequest", back_populates="scheduled_hours")
    price = relationship("Price")
