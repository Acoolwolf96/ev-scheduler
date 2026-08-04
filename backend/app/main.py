from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import charging_requests

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EV Charging Scheduler")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(charging_requests.router)


@app.get("/health")
def health():
    return {"status": "ok"}
