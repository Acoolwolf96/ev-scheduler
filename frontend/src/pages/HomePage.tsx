import { useEffect, useState } from 'react';
import { getTodaysPrices, createChargingRequest } from '../api';
import type { TodayPricesOut, ChargingRequestOut } from '../types';
import { formatPricePerKwh } from '../utils';

function HomePage() {
  const [data, setData] = useState<TodayPricesOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [chargerPowerKw, setChargerPowerKw] = useState<number>(() => {
    const stored = localStorage.getItem('chargerPowerKw');
    return stored ? Number(stored) : 7;
  });

  const [submittingMode, setSubmittingMode] = useState<'now' | 'cheapest' | null>(null);
  const [result, setResult] = useState<ChargingRequestOut | null>(null);

  useEffect(() => {
    getTodaysPrices()
      .then(setData)
      .catch(() => setError("Could not load today's prices — check the backend is running."));
  }, []);

  useEffect(() => {
    localStorage.setItem('chargerPowerKw', String(chargerPowerKw));
  }, [chargerPowerKw]);

  const current = data?.prices[0] ?? null;
  const cheapest = data?.cheapest ?? null;

  async function handleCharge(mode: 'now' | 'cheapest') {
    const target = mode === 'now' ? current : cheapest;
    if (!target) return;

    setSubmittingMode(mode);
    setError(null);
    setResult(null);

    try {
      const response = await createChargingRequest({
        hours_needed: 1,
        deadline: target.timestamp,
        charger_power_kw: chargerPowerKw,
      });
      setResult(response);
    } catch {
      setError('Could not schedule charging — check the backend is running.');
    } finally {
      setSubmittingMode(null);
    }
  }

  return (
    <>
      <div className="eyebrow">Smart EV Charging</div>
      <h1 className="title">Charge on the cheapest hours</h1>
      <p className="subtitle">Not whenever you happen to plug in.</p>

      <div className="settings-row">
        <span>Charger power</span>
        <input
          type="number"
          className="power-input"
          value={chargerPowerKw}
          min={1}
          onChange={(e) => setChargerPowerKw(Number(e.target.value))}
        />
        <span>kW</span>
      </div>

      {error && <p className="error">{error}</p>}

      {data && current && cheapest && (
        <>
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Current price</div>
              <div className="stat-value">{formatPricePerKwh(current.price_eur_kwh)}</div>
              <div className="stat-sub">per kWh, right now</div>
            </div>
            <div className="stat highlight">
              <div className="stat-label">Cheapest today</div>
              <div className="stat-value">{formatPricePerKwh(cheapest.price_eur_kwh)}</div>
              <div className="stat-sub">
                at {new Date(cheapest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="actions">
            <button
              className="action-btn now"
              disabled={submittingMode !== null}
              onClick={() => handleCharge('now')}
            >
              <div className="action-label">
                {submittingMode === 'now' ? 'Scheduling…' : 'Charge now'}
              </div>
              <div className="action-price">
                €{(current.price_eur_kwh * chargerPowerKw).toFixed(2)}
              </div>
            </button>

            <button
              className="action-btn cheap"
              disabled={submittingMode !== null}
              onClick={() => handleCharge('cheapest')}
            >
              <div className="action-label">
                {submittingMode === 'cheapest'
                  ? 'Scheduling…'
                  : `Charge at ${new Date(cheapest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </div>
              <div className="action-price">
                €{(cheapest.price_eur_kwh * chargerPowerKw).toFixed(2)}
              </div>
            </button>
          </div>

          {result && (
            <div className="receipt">
              <div className="receipt-row">
                <span>Charging immediately would cost</span>
                <span className="baseline">€{result.baseline_cost.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>This session costs</span>
                <span className="optimized">€{result.optimized_cost.toFixed(2)}</span>
              </div>

              <div className="saved-label">You saved</div>
              <div className="saved-amount">
                €{(result.baseline_cost - result.optimized_cost).toFixed(2)}
              </div>

              <div className="chips">
                {result.scheduled_hours.map((sh, i) => (
                  <span className="chip" key={i}>
                    {new Date(sh.price.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' '}· {formatPricePerKwh(sh.price.price_eur_kwh)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default HomePage;
