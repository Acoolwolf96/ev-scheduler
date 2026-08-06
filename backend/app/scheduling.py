from typing import List
import math
from app.models import Price


def pick_cheapest_hours(available_prices: List[Price], hours_needed: int) -> List[Price]:
    """Pick the N individually cheapest hours from the available window.

    An EV charger can pause and resume freely, unlike a dishwasher — so
    the chosen hours don't need to be back to back, just the cheapest
    N overall.
    """
    sorted_by_price = sorted(available_prices, key=lambda p: p.price_eur_kwh)
    return sorted_by_price[:hours_needed]


def calculate_baseline_cost(available_prices: List[Price], hours_needed: int, charger_power_kw: float) -> float:
    """What charging immediately would cost: the first N hours in
    chronological order, no optimization."""
    chronological = sorted(available_prices, key=lambda p: p.timestamp)
    immediate_hours = chronological[:hours_needed]
    total_price = float(sum(p.price_eur_kwh for p in immediate_hours))
    return total_price * charger_power_kw


def calculate_optimized_cost(chosen_hours: List[Price], charger_power_kw: float) -> float:
    """What charging on the chosen cheap hours actually costs."""
    total_price = float(sum(p.price_eur_kwh for p in chosen_hours))
    return total_price * charger_power_kw

def calculate_hours_needed(
    current_charge_percent: float,
    target_charge_percent: float,
    battery_capacity_kwh: float,
    charger_power_kw: float,
    forecast_low_temp_c: float | None = None,
) -> int:
    """How many hours of charging are needed, accounting for cold-weather
    efficiency loss. The efficiency numbers below are a simplified heuristic,
    not a validated per-vehicle model — real battery management systems vary."""
    energy_needed_kwh = max(0.0, target_charge_percent - current_charge_percent) / 100 * battery_capacity_kwh

    efficiency = 1.0
    if forecast_low_temp_c is not None:
        if forecast_low_temp_c < -10:
            efficiency = 0.75
        elif forecast_low_temp_c < 0:
            efficiency = 0.85

    adjusted_energy_needed = energy_needed_kwh / efficiency
    hours = adjusted_energy_needed / charger_power_kw
    return max(1, math.ceil(hours))


def pick_cheapest_window(available_prices: List[Price], hours_needed: int) -> List[Price]:
    """Find the cheapest CONTIGUOUS block of hours_needed consecutive hours —
    unlike pick_cheapest_hours, which scatters. Assumes available_prices is
    sorted chronologically with no gaps."""
    if len(available_prices) < hours_needed:
        return []

    best_start = 0
    best_total = None
    for i in range(len(available_prices) - hours_needed + 1):
        window = available_prices[i : i + hours_needed]
        total = sum(p.price_eur_kwh for p in window)
        if best_total is None or total < best_total:
            best_total = total
            best_start = i

    return available_prices[best_start : best_start + hours_needed]

def test_two_pass_refinement_would_change_result_in_cold_scenario():
    """Simulates the interview-relevant case: the 24h worst-case estimate
    and the actual scheduled-window temperature disagree, and the second
    pass should produce a different (larger) hours_needed than the first."""
    rough_estimate_hours = calculate_hours_needed(
        current_charge_percent=25,
        target_charge_percent=90,
        battery_capacity_kwh=60,
        charger_power_kw=11,
        forecast_low_temp_c=5,  # rough 24h low: mild, no penalty
    )
    refined_hours = calculate_hours_needed(
        current_charge_percent=25,
        target_charge_percent=90,
        battery_capacity_kwh=60,
        charger_power_kw=11,
        forecast_low_temp_c=-15,  # actual temp during the charging window: cold
    )
    assert rough_estimate_hours == 4
    assert refined_hours == 5
    assert refined_hours > rough_estimate_hours