from app.database import Base, engine
from app import models  # noqa: F401 — import registers the models with Base

Base.metadata.create_all(bind=engine)
print("Tables created.")
