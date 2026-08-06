from app.weather import get_forecast_low

if __name__ == "__main__":
    result = get_forecast_low("Tampere")
    if result:
        timestamp, temp = result
        print(f"Forecast low: {temp}°C at {timestamp.isoformat()}")
    else:
        print("Could not fetch forecast.")
