from datetime import datetime

from app.models import Price
from app.scheduling import (
    pick_cheapest_hours,
    calculate_baseline_cost,
    calculate_optimized_cost,
)

# Same numbers from our by-hand example
prices = [
    Price(timestamp=datetime(2026, 8, 4, 18, 0), price_eur_kwh=0.31),
    Price(timestamp=datetime(2026, 8, 4, 19, 0), price_eur_kwh=0.29),
    Price(timestamp=datetime(2026, 8, 4, 20, 0), price_eur_kwh=0.27),
    Price(timestamp=datetime(2026, 8, 4, 23, 0), price_eur_kwh=0.08),
    Price(timestamp=datetime(2026, 8, 5, 2, 0), price_eur_kwh=0.05),
]

hours_needed = 3
charger_power_kw = 7

chosen = pick_cheapest_hours(prices, hours_needed)
baseline = calculate_baseline_cost(prices, hours_needed, charger_power_kw)
optimized = calculate_optimized_cost(chosen, charger_power_kw)

print("Chosen hours:", [p.timestamp.strftime("%H:%M") for p in chosen])
print(f"Baseline cost (charge immediately): EUR {baseline:.2f}")
print(f"Optimized cost (cheapest hours):    EUR {optimized:.2f}")
print(f"Savings:                            EUR {baseline - optimized:.2f}")

assert round(baseline, 2) == 6.09
assert round(optimized, 2) == 2.80
print("\nMatches the by-hand calculation.")
