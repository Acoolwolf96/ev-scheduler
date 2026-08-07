import { useEffect, useState } from 'react';
import { getCurrentCarbon } from './api';
import type { CarbonIntensityOut } from './types';

function CarbonStat() {
  const [carbon, setCarbon] = useState<CarbonIntensityOut | null>(null);

  useEffect(() => {
    function fetchCarbon() {
      getCurrentCarbon()
        .then(setCarbon)
        .catch(() => setCarbon(null));
    }

    fetchCarbon();

    // Fingrid updates this reading every 3 minutes — refreshing every
    // minute keeps it genuinely current without over-polling.
    const interval = setInterval(fetchCarbon, 60_000);

    // Cleanup: without this, navigating away would leave the interval
    // running forever in the background, quietly leaking memory and
    // making pointless API calls for a component nobody's looking at.
    return () => clearInterval(interval);
  }, []);

  if (!carbon || carbon.value_gco2_kwh === null) {
    return null;
  }

  return (
    <div className="carbon-stat">
      <span className="carbon-label">Grid carbon intensity right now</span>
      <span className="carbon-value">{carbon.value_gco2_kwh.toFixed(1)} g CO₂/kWh</span>
      <span className="carbon-note">
        Finland's grid is very clean — this is a live reading, not a forecast,
        so it can't tell you the emissions of a session scheduled for later.
      </span>
    </div>
  );
}

export default CarbonStat;
