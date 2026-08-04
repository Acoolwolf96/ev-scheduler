from datetime import datetime

from app.models import Price
from app.scheduling import (
    pick_cheapest_hours,
    calculate_baseline_cost,
    calculate_optimized_cost,
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
