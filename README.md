# Smart EV Charging

An EV charging optimizer for homeowners on a spot-price electricity
contract. Rather than just showing that electricity is cheap right
now, it calculates the actual optimal charging window given your
car's constraints: current battery level, target charge,
target time, and charger speed. It also accounts for cold weather
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
hours that don't form a usable plan. A calculated plan is only saved
to your history once you confirm it previewing costs nothing and
touches no record.

Live grid carbon intensity is also shown for context. It's a
real-time reading, not a forecast, so it informs but doesn't factor
into the schedule itself.

## Stack

- Backend: Python (FastAPI), SQLAlchemy
- Database: PostgreSQL
- Frontend: React + TypeScript
- Data: ENTSO-E day-ahead electricity prices, FMI weather forecasts,
  Fingrid grid carbon intensity
- Deployment: Docker Compose

## Running locally

Create a `.env` file in the project root:

\`\`\`
ENTSOE_TOKEN=your-entsoe-token
FINGRID_API_KEY=your-fingrid-api-key
VITE_API_URL=http://localhost:8000
\`\`\`

Then:

\`\`\`bash
docker compose up --build
\`\`\`

Frontend: http://localhost:5173
Backend: http://localhost:8000/docs
