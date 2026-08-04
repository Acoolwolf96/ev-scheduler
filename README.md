# Smart EV Charging

Schedules EV charging sessions for the cheapest available electricity
hours before a deadline, using real day-ahead spot prices for Finland.

## The problem

Electricity prices change hour to hour, but most people just plug in
and charge immediately, overpaying without realizing it. This
automates the one decision that actually saves money: which hours to
charge in — and tracks savings over time so you can see the impact
week to week, month to month, year to year.

## Stack

- Backend: Python (FastAPI), SQLAlchemy
- Database: PostgreSQL
- Frontend: React + TypeScript (Vite)
- Deployment: Docker Compose

## Running locally

\`\`\`bash
cp backend/.env.example backend/.env
# edit backend/.env with your ENTSOE_TOKEN once approved

docker compose up --build
\`\`\`

Backend: http://localhost:8000/docs
Frontend: run separately via \`cd frontend && npm install && npm run dev\`
