export function formatPricePerKwh(priceEurKwh: number): string {
  return `${(priceEurKwh * 100).toFixed(1)} cents/kWh`;
}

export type PriceUnit = 'c/kWh' | '€/kWh' | '€/MWh';

export function formatPrice(priceEurKwh: number, unit: PriceUnit): string {
  if (unit === '€/kWh') return `€${priceEurKwh.toFixed(3)}/kWh`;
  if (unit === '€/MWh') return `€${(priceEurKwh * 1000).toFixed(1)}/MWh`;
  return `${(priceEurKwh * 100).toFixed(1)} c/kWh`;
}

export function formatPriceValue(priceEurKwh: number, unit: PriceUnit): string {
  if (unit === '€/kWh') return priceEurKwh.toFixed(3);
  if (unit === '€/MWh') return (priceEurKwh * 1000).toFixed(1);
  return (priceEurKwh * 100).toFixed(1);
}
