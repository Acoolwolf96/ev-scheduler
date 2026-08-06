import type { PriceOut } from './types';
import { formatPriceValue, type PriceUnit } from './utils';

interface PriceCardsProps {
  prices: PriceOut[];
  cheapest: PriceOut | null;
  unit: PriceUnit;
}

function PriceCards({ prices, cheapest, unit }: PriceCardsProps) {
  return (
    <div className="price-cards">
      {prices.map((p, i) => {
        const isCheapest = cheapest?.timestamp === p.timestamp;
        const isNow = i === 0;
        const time = new Date(p.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={i} className={`price-card ${isCheapest ? 'price-card-cheapest' : ''}`}>
            {isCheapest && <span className="price-card-badge">Cheapest</span>}
            <div className="price-card-time">
              {time}
              {isNow && <span className="price-card-now"> · now</span>}
            </div>
            <div className="price-card-value">{formatPriceValue(p.price_eur_kwh, unit)}</div>
            <div className="price-card-unit">{unit}</div>
          </div>
        );
      })}
    </div>
  );
}

export default PriceCards;
