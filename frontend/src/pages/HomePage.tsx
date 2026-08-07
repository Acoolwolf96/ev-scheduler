import { useState } from 'react';
import { optimizeCharging } from '../api';
import type { ChargingRequestOut } from '../types';
import { formatPricePerKwh } from '../utils';

type Preset = 'tonight' | 'tomorrow-morning' | 'tomorrow-evening' | 'custom';

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getPresetDate(preset: Exclude<Preset, 'custom'>): Date {
  const now = new Date();
  const result = new Date(now);

  if (preset === 'tonight') {
    result.setHours(23, 0, 0, 0);
    if (result <= now) result.setDate(result.getDate() + 1);
  } else if (preset === 'tomorrow-morning') {
    result.setDate(result.getDate() + 1);
    result.setHours(7, 0, 0, 0);
  } else {
    result.setDate(result.getDate() + 1);
    result.setHours(18, 0, 0, 0);
  }
  return result;
}

function HomePage() {
  const [chargerPowerKw, setChargerPowerKw] = useState<number>(() => {
    const stored = localStorage.getItem('chargerPowerKw');
    return stored ? Number(stored) : 7;
  });
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(() => {
    const stored = localStorage.getItem('batteryCapacityKwh');
    return stored ? Number(stored) : 60;
  });
  const [place, setPlace] = useState<string>(() => {
    return localStorage.getItem('place') ?? 'Tampere';
  });

  const [currentPercent, setCurrentPercent] = useState(30);
  const [targetPercent, setTargetPercent] = useState(80);

  const [preset, setPreset] = useState<Preset>('tomorrow-morning');
  const [departureTime, setDepartureTime] = useState<string>(() =>
    toLocalInputValue(getPresetDate('tomorrow-morning'))
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChargingRequestOut | null>(null);

  function saveSetting(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  function selectPreset(p: Preset) {
    setPreset(p);
    if (p !== 'custom') {
      setDepartureTime(toLocalInputValue(getPresetDate(p)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await optimizeCharging({
        current_charge_percent: currentPercent,
        target_charge_percent: targetPercent,
        battery_capacity_kwh: batteryCapacityKwh,
        charger_power_kw: chargerPowerKw,
        departure_time: new Date(departureTime).toISOString(),
        place,
      });
      setResult(response);
    } catch {
      setError('Could not calculate a charging plan — check the backend is running.');
    } finally {
      setSubmitting(false);
    }
  }

  const departureLabel = departureTime
    ? new Date(departureTime).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <>
      <div className="eyebrow">Smart EV Charging</div>
      <h1 className="title">Plan your charging</h1>
      <p className="subtitle">
        Tell it your battery, your charger, and when you're leaving — it finds the
        cheapest window that gets you there, accounting for weather.
      </p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Current charge (%)</label>
              <input
                type="number"
                value={currentPercent}
                min={0}
                max={100}
                onChange={(e) => setCurrentPercent(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Target charge (%)</label>
              <input
                type="number"
                value={targetPercent}
                min={0}
                max={100}
                onChange={(e) => setTargetPercent(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="field">
            <label>Leaving</label>
            <div className="preset-row">
              <button
                type="button"
                className={`preset-btn ${preset === 'tonight' ? 'active' : ''}`}
                onClick={() => selectPreset('tonight')}
              >
                Tonight
              </button>
              <button
                type="button"
                className={`preset-btn ${preset === 'tomorrow-morning' ? 'active' : ''}`}
                onClick={() => selectPreset('tomorrow-morning')}
              >
                Tomorrow morning
              </button>
              <button
                type="button"
                className={`preset-btn ${preset === 'tomorrow-evening' ? 'active' : ''}`}
                onClick={() => selectPreset('tomorrow-evening')}
              >
                Tomorrow evening
              </button>
              <button
                type="button"
                className={`preset-btn ${preset === 'custom' ? 'active' : ''}`}
                onClick={() => selectPreset('custom')}
              >
                Custom
              </button>
            </div>

            {preset === 'custom' ? (
              <input
                type="datetime-local"
                className="datetime-input"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            ) : (
              <div className="departure-preview">{departureLabel}</div>
            )}
          </div>

          <div className="settings-row">
            <span>Battery</span>
            <input
              type="number"
              className="power-input"
              value={batteryCapacityKwh}
              min={1}
              onChange={(e) => {
                setBatteryCapacityKwh(Number(e.target.value));
                saveSetting('batteryCapacityKwh', e.target.value);
              }}
            />
            <span>kWh</span>

            <span style={{ marginLeft: 16 }}>Charger</span>
            <input
              type="number"
              className="power-input"
              value={chargerPowerKw}
              min={1}
              onChange={(e) => {
                setChargerPowerKw(Number(e.target.value));
                saveSetting('chargerPowerKw', e.target.value);
              }}
            />
            <span>kW</span>

            <span style={{ marginLeft: 16 }}>Location</span>
            <input
              type="text"
              className="power-input"
              style={{ width: 90 }}
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                saveSetting('place', e.target.value);
              }}
            />
          </div>

          <button type="submit" className="submit" disabled={submitting}>
            {submitting ? 'Calculating…' : 'Find optimal charging time'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="receipt">
            <div className="plan-window">
              <div className="plan-window-label">Charge from</div>
              <div className="plan-window-time">
                {result.start_time &&
                  new Date(result.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {result.finish_time &&
                  new Date(result.finish_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="receipt-row">
              <span>Charging immediately would cost</span>
              <span className="baseline">€{result.baseline_cost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>This plan costs</span>
              <span className="optimized">€{result.optimized_cost.toFixed(2)}</span>
            </div>

            <div className="saved-label">You saved</div>
            <div className="saved-amount">
              €{(result.baseline_cost - result.optimized_cost).toFixed(2)}
            </div>

            {result.forecast_low_temp_c !== null && result.forecast_low_temp_c < 0 && (
              <p className="weather-note">
                Cold weather forecast ({result.forecast_low_temp_c}°C) — extra charging
                time included to compensate for reduced efficiency.
              </p>
            )}

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
      </div>
    </>
  );
}

export default HomePage;
