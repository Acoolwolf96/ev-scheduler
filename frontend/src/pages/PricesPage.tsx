import { useEffect, useState } from 'react';
import { getTodaysPrices, getCurrentCarbon } from '../api';
import type { TodayPricesOut, CarbonIntensityOut } from '../types';
import PriceCards from '../PriceCards';
import type { PriceUnit } from '../utils';

const UNITS: PriceUnit[] = ['c/kWh', '€/kWh', '€/MWh'];

function PricesPage() {
  const [data, setData] = useState<TodayPricesOut | null>(null);
  const [carbon, setCarbon] = useState<CarbonIntensityOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<PriceUnit>('c/kWh');

  useEffect(() => {
    getTodaysPrices()
      .then(setData)
      .catch(() => setError("Could not load today's prices — check the backend is running."));

    // Carbon data is purely informational — its own try/catch so a failure
    // here never blocks the price board, which is the core feature.
    getCurrentCarbon()
      .then(setCarbon)
      .catch(() => setCarbon(null));
  }, []);

  const today = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <div className="eyebrow">Live spot prices — {today}</div>
      <h1 className="title">Today's prices</h1>
      <p className="subtitle">
        Wholesale electricity prices for Finland's day-ahead market. Shown in cents
        per kWh by default — grid fees, tax, and supplier margin aren't included,
        this is the raw market rate.
      </p>

      {carbon && carbon.value_gco2_kwh !== null && (
        <div className="carbon-stat">
          <span className="carbon-label">Grid carbon intensity right now</span>
          <span className="carbon-value">{carbon.value_gco2_kwh.toFixed(1)} g CO₂/kWh</span>
          <span className="carbon-note">
            Finland's grid is very clean — this is a live reading, not a forecast,
            so it can't be used to plan ahead the way prices can.
          </span>
        </div>
      )}

      <div className="period-toggle" style={{ marginBottom: 24, marginTop: 20 }}>
        {UNITS.map((u) => (
          <button
            key={u}
            className={`period-btn ${unit === u ? 'active' : ''}`}
            onClick={() => setUnit(u)}
          >
            {u}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {data && <PriceCards prices={data.prices} cheapest={data.cheapest} unit={unit} />}
    </>
  );
}

export default PricesPage;
