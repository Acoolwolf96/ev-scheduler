# Smart EV Charging

An EV charging optimizer for homeowners on a spot-price electricity
contract. Rather than just showing that electricity is cheap right
now, it calculates the actual optimal charging window given your
car's real constraints: current battery level, target charge,
departure time, and charger speed. It also accounts for cold weather
slowing charging down.

## The problem

Electricity prices change hour to hour on a spot contract, but most
people just plug in and charge immediately, overpaying without
realizing it. Timing charging around cheap hours is a real, paid-for
service today. This automates that decision properly, rather than
just displaying a price list and leaving the math to you.

## Who this is for

Homeowners with a spot-price electricity contract, charging an EV at
home. Not fixed-rate customers, since there's nothing to optimize
when the price never changes. Not public or on-the-road charging
either, since that's a different problem with no shared pricing data
available across networks.

## How it works

Given your battery's current and target charge, capacity, charger
power, and a deadline, it calculates how many hours of charging are
actually needed, adjusted for cold-weather efficiency loss where
relevant. It then finds the cheapest contiguous window of that length
using real day-ahead spot prices, rather than picking scattered cheap
hours that don't form a usable plan.

## Stack

- Backend: Python (FastAPI), SQLAlchemy
- Database: PostgreSQL
- Frontend: React + TypeScript
- Data: ENTSO-E day-ahead electricity prices, FMI weather forecasts
- Deployment: Docker Compose

## Roadmap

This is deliberately built in phases: pure software first.

1. **Software only** (current). User-provided battery state, real
   price and weather data, no hardware required.
2. **Smart charger integration.** Send the schedule directly to
   chargers that expose an API (Zaptec, Easee, OCPP-compatible),
   instead of just displaying a recommendation.
3. **Vehicle API integration.** Read battery state directly from the
   car instead of manual entry, where manufacturer APIs allow it.

## Running locally

\`\`\`bash
cp backend/.env.example backend/.env


docker compose up --build
\`\`\`

Backend: http://localhost:8000/docs
Frontend: run separately via \`cd frontend && npm install && npm run dev\`
