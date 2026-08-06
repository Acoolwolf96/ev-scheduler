from datetime import datetime

from app.models import Price
from app.scheduling import (
    pick_cheapest_hours,
    calculate_baseline_cost,
    calculate_optimized_cost,
    calculate_hours_needed,
    pick_cheapest_window,
)

# Same fixed prices we verified by hand — this is the known-correct case
PRICES = [
    Price(timestamp=datetime(2026, 8, 4, 18, 0), price_eur_kwh=0.31),
    Price(timestamp=datetime(2026, 8, 4, 19, 0), price_eur_kwh=0.29),
    Price(timestamp=datetime(2026, 8, 4, 20, 0), price_eur_kwh=0.27),
    Price(timestamp=datetime(2026, 8, 4, 23, 0), price_eur_kwh=0.08),
    Price(timestamp=datetime(2026, 8, 5, 2, 0), price_eur_kwh=0.05),
]


def test_pick_cheapest_hours_picks_lowest_prices():
    chosen = pick_cheapest_hours(PRICES, hours_needed=3)
    chosen_prices = sorted(float(p.price_eur_kwh) for p in chosen)
    assert chosen_prices == [0.05, 0.08, 0.27]


def test_pick_cheapest_hours_respects_count():
    chosen = pick_cheapest_hours(PRICES, hours_needed=2)
    assert len(chosen) == 2


def test_baseline_cost_uses_first_chronological_hours():
    cost = calculate_baseline_cost(PRICES, hours_needed=3, charger_power_kw=7)
    assert round(cost, 2) == 6.09


def test_optimized_cost_is_cheaper_than_baseline():
    chosen = pick_cheapest_hours(PRICES, hours_needed=3)
    optimized = calculate_optimized_cost(chosen, charger_power_kw=7)
    baseline = calculate_baseline_cost(PRICES, hours_needed=3, charger_power_kw=7)
    assert round(optimized, 2) == 2.80
    assert optimized < baseline


def test_pick_cheapest_hours_with_single_price():
    single = [PRICES[0]]
    chosen = pick_cheapest_hours(single, hours_needed=1)
    assert len(chosen) == 1
    assert chosen[0] == PRICES[0]


# --- calculate_hours_needed: matches the by-hand example worked through above ---

def test_calculate_hours_needed_without_weather():
    hours = calculate_hours_needed(
        current_charge_percent=25,
        target_charge_percent=90,
        battery_capacity_kwh=60,
        charger_power_kw=11,
    )
    assert hours == 4


def test_calculate_hours_needed_with_extreme_cold():
    hours = calculate_hours_needed(
        current_charge_percent=25,
        target_charge_percent=90,
        battery_capacity_kwh=60,
        charger_power_kw=11,
        forecast_low_temp_c=-20,
    )
    assert hours == 5


def test_calculate_hours_needed_mild_cold():
    hours = calculate_hours_needed(
        current_charge_percent=25,
        target_charge_percent=90,
        battery_capacity_kwh=60,
        charger_power_kw=11,
        forecast_low_temp_c=-5,
    )
    assert hours == 5


def test_calculate_hours_needed_never_returns_zero():
    hours = calculate_hours_needed(
        current_charge_percent=90,
        target_charge_percent=80,
        battery_capacity_kwh=60,
        charger_power_kw=11,
    )
    assert hours == 1


# --- pick_cheapest_window: contiguous block, not scattered hours ---

def test_pick_cheapest_window_finds_contiguous_block():
    prices = [
        Price(timestamp=datetime(2026, 8, 4, 18, 0), price_eur_kwh=0.31),
        Price(timestamp=datetime(2026, 8, 4, 19, 0), price_eur_kwh=0.29),
        Price(timestamp=datetime(2026, 8, 4, 20, 0), price_eur_kwh=0.05),
        Price(timestamp=datetime(2026, 8, 4, 21, 0), price_eur_kwh=0.06),
        Price(timestamp=datetime(2026, 8, 4, 22, 0), price_eur_kwh=0.27),
    ]
    window = pick_cheapest_window(prices, hours_needed=2)
    window_prices = [float(p.price_eur_kwh) for p in window]
    assert window_prices == [0.05, 0.06]


def test_pick_cheapest_window_returns_empty_when_not_enough_data():
    window = pick_cheapest_window([PRICES[0]], hours_needed=3)
    assert window == []


def test_two_pass_refinement_would_change_result_in_cold_scenario():
    """Simulates the interview-relevant case: the 24h worst-case estimate
    and the actual scheduled-window temperature disagree, and the second
    pass should produce a different (larger) hours_needed than the first."""
    rough_estimate_hours = calculate_hours_needed(
        current_charge_percent=25,
        target_charge_percent=90,
        battery_capacity_kwh=60,
        charger_power_kw=11,
        forecast_low_temp_c=5,
    )
    refined_hours = calculate_hours_needed(
        current_charge_percent=25,
        target_charge_percent=90,
        battery_capacity_kwh=60,
        charger_power_kw=11,
        forecast_low_temp_c=-15,
    )
    assert rough_estimate_hours == 4
    assert refined_hours == 5
    assert refined_hours > rough_estimate_hours
