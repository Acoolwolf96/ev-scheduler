import { useEffect, useState } from 'react';
import { getTodaysPrices } from '../api';
import type { TodayPricesOut } from '../types';
import PriceCards from '../PriceCards';
import type { PriceUnit } from '../utils';

const UNITS: PriceUnit[] = ['c/kWh', '€/kWh', '€/MWh'];

function PricesPage() {
  const [data, setData] = useState<TodayPricesOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<PriceUnit>('c/kWh');

  useEffect(() => {
    getTodaysPrices()
      .then(setData)
      .catch(() => setError("Could not load today's prices — check the backend is running."));
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

      <div className="period-toggle" style={{ marginBottom: 24 }}>
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
