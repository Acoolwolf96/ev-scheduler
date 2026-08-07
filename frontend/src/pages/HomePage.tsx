import { useState } from 'react';
import { previewCharging, confirmCharging } from '../api';
import type { DeparturePreset, HomePlanState } from '../types';
import { formatPricePerKwh } from '../utils';
import CarbonStat from '../CarbonStat';

interface HomePageProps {
  state: HomePlanState;
  update: (partial: Partial<HomePlanState>) => void;
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getPresetDate(preset: Exclude<DeparturePreset, 'custom'>): Date {
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

function HomePage({ state, update }: HomePageProps) {
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

  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function saveSetting(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  function selectPreset(p: DeparturePreset) {
    if (p !== 'custom') {
      update({ preset: p, departureTime: toLocalInputValue(getPresetDate(p)) });
    } else {
      update({ preset: p });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const request = {
      current_charge_percent: state.currentPercent,
      target_charge_percent: state.targetPercent,
      battery_capacity_kwh: batteryCapacityKwh,
      charger_power_kw: chargerPowerKw,
      departure_time: new Date(state.departureTime).toISOString(),
      place,
    };

    try {
      const response = await previewCharging(request);
      update({ preview: response, lastRequest: request, confirmedId: null, priceChangeNotice: null });
    } catch {
      setError('Could not calculate a charging plan — check the backend is running.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!state.lastRequest || !state.preview) return;
    setConfirming(true);
    setError(null);

    try {
      const response = await confirmCharging(state.lastRequest);

      const costDiffers = Math.abs(response.optimized_cost - state.preview.optimized_cost) > 0.005;
      const windowDiffers =
        response.start_time !== state.preview.start_time ||
        response.finish_time !== state.preview.finish_time;

      update({
        confirmedId: response.id,
        priceChangeNotice: costDiffers || windowDiffers
          ? { previous: state.preview, updated: response }
          : null,
      });
    } catch {
      setError('Could not save this plan — check the backend is running.');
    } finally {
      setConfirming(false);
    }
  }

  const departureLabel = state.departureTime
    ? new Date(state.departureTime).toLocaleString([], {
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

      <CarbonStat />

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Current charge (%)</label>
              <input
                type="number"
                value={state.currentPercent}
                min={0}
                max={100}
                onChange={(e) => update({ currentPercent: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Target charge (%)</label>
              <input
                type="number"
                value={state.targetPercent}
                min={0}
                max={100}
                onChange={(e) => update({ targetPercent: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="field">
            <label>Leaving</label>
            <div className="preset-row">
              <button
                type="button"
                className={`preset-btn ${state.preset === 'tonight' ? 'active' : ''}`}
                onClick={() => selectPreset('tonight')}
              >
                Tonight
              </button>
              <button
                type="button"
                className={`preset-btn ${state.preset === 'tomorrow-morning' ? 'active' : ''}`}
                onClick={() => selectPreset('tomorrow-morning')}
              >
                Tomorrow morning
              </button>
              <button
                type="button"
                className={`preset-btn ${state.preset === 'tomorrow-evening' ? 'active' : ''}`}
                onClick={() => selectPreset('tomorrow-evening')}
              >
                Tomorrow evening
              </button>
              <button
                type="button"
                className={`preset-btn ${state.preset === 'custom' ? 'active' : ''}`}
                onClick={() => selectPreset('custom')}
              >
                Custom
              </button>
            </div>

            {state.preset === 'custom' ? (
              <input
                type="datetime-local"
                className="datetime-input"
                value={state.departureTime}
                onChange={(e) => update({ departureTime: e.target.value })}
                required
              />
            ) : (
              <div className="departure-preview">{departureLabel}</div>
            )}
          </div>

          <div className="settings-row">
            <div className="setting-group">
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
            </div>

            <div className="setting-group">
              <span>Charger</span>
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
            </div>

            <div className="setting-group">
              <span>Location</span>
              <input
                type="text"
                className="power-input location-input"
                value={place}
                onChange={(e) => {
                  setPlace(e.target.value);
                  saveSetting('place', e.target.value);
                }}
              />
            </div>
          </div>

          <button type="submit" className="submit" disabled={submitting}>
            {submitting ? 'Calculating…' : 'Find optimal charging time'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {state.preview && (
          <div className="receipt">
            <div className="plan-window">
              <div className="plan-window-label">Charge from</div>
              <div className="plan-window-time">
                {new Date(state.preview.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(state.preview.finish_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="receipt-row">
              <span>Charging immediately would cost</span>
              <span className="baseline">€{state.preview.baseline_cost.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>This plan costs</span>
              <span className="optimized">€{state.preview.optimized_cost.toFixed(2)}</span>
            </div>

            <div className="saved-label">You'd save</div>
            <div className="saved-amount">
              €{(state.preview.baseline_cost - state.preview.optimized_cost).toFixed(2)}
            </div>

            {state.preview.forecast_low_temp_c !== null && state.preview.forecast_low_temp_c < 0 && (
              <p className="weather-note">
                Cold weather forecast ({state.preview.forecast_low_temp_c}°C) — extra charging
                time included to compensate for reduced efficiency.
              </p>
            )}

            <div className="chips">
              {state.preview.scheduled_hours.map((p, i) => (
                <span className="chip" key={i}>
                  {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' '}· {formatPricePerKwh(p.price_eur_kwh)}
                </span>
              ))}
            </div>

            {state.confirmedId === null ? (
              <button
                type="button"
                className="confirm-btn"
                disabled={confirming}
                onClick={handleConfirm}
              >
                {confirming ? 'Saving…' : 'Confirm this plan'}
              </button>
            ) : state.priceChangeNotice ? (
              <div className="price-change-notice">
                <div className="price-change-title">Plan updated before saving</div>
                <p>
                  Time passed between preview and confirmation, so this was
                  recalculated against the current window — same idea as a
                  quote changing before a trade executes.
                </p>
                <div className="price-change-row">
                  <span>Previewed</span>
                  <span>
                    {new Date(state.priceChangeNotice.previous.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(state.priceChangeNotice.previous.finish_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · €'}{state.priceChangeNotice.previous.optimized_cost.toFixed(2)}
                  </span>
                </div>
                <div className="price-change-row">
                  <span>Actually saved</span>
                  <span>
                    {state.priceChangeNotice.updated.start_time &&
                      new Date(state.priceChangeNotice.updated.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {state.priceChangeNotice.updated.finish_time &&
                      new Date(state.priceChangeNotice.updated.finish_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · €'}{state.priceChangeNotice.updated.optimized_cost.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="saved-badge">Saved to your history</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default HomePage;
