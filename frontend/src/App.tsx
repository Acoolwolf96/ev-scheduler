import { useState } from 'react';
import { createChargingRequest } from './api';
import type { ChargingRequestOut } from './types';
import './App.css';

function App() {
  const [hoursNeeded, setHoursNeeded] = useState(3);
  const [deadline, setDeadline] = useState('');
  const [chargerPowerKw, setChargerPowerKw] = useState(7);

  const [result, setResult] = useState<ChargingRequestOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await createChargingRequest({
        hours_needed: hoursNeeded,
        deadline: new Date(deadline).toISOString(),
        charger_power_kw: chargerPowerKw,
      });
      setResult(response);
    } catch {
      setError('Could not schedule charging — check the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="panel">
        <div className="eyebrow">Spot-price scheduling</div>
        <h1 className="title">Smart EV Charging</h1>
        <p className="subtitle">
          Charge on the cheapest hours before your deadline, not whenever you plug in.
        </p>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Hours needed to charge</label>
              <input
                type="number"
                value={hoursNeeded}
                onChange={(e) => setHoursNeeded(Number(e.target.value))}
                min={1}
              />
            </div>

            <div className="field">
              <label>Charge by (deadline)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Charger power (kW)</label>
              <input
                type="number"
                value={chargerPowerKw}
                onChange={(e) => setChargerPowerKw(Number(e.target.value))}
                min={1}
              />
            </div>

            <button type="submit" className="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling…' : 'Schedule charging'}
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          {result && (
            <div className="receipt">
              <div className="receipt-row">
                <span>Charging immediately</span>
                <span className="baseline">€{result.baseline_cost.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Scheduled</span>
                <span className="optimized">€{result.optimized_cost.toFixed(2)}</span>
              </div>

              <div className="saved-label">You saved</div>
              <div className="saved-amount">
                €{(result.baseline_cost - result.optimized_cost).toFixed(2)}
              </div>

              <div className="chips">
                {result.scheduled_hours.map((sh, i) => (
                  <span className="chip" key={i}>
                    {new Date(sh.price.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · €{sh.price.price_eur_kwh}/kWh
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
