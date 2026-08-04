from typing import List

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
