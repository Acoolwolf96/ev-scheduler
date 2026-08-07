from fastapi import APIRouter

from app import schemas
from app.carbon import get_current_emission_factor

router = APIRouter(prefix="/carbon", tags=["carbon"])


@router.get("/current", response_model=schemas.CarbonIntensityOut)
def get_current_carbon():
    result = get_current_emission_factor()
    if result is None:
        return schemas.CarbonIntensityOut(timestamp=None, value_gco2_kwh=None)

    timestamp, value = result
    return schemas.CarbonIntensityOut(timestamp=timestamp, value_gco2_kwh=value)
