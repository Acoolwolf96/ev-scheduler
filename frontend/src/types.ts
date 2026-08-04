export interface PriceOut {
  timestamp: string;
  price_eur_kwh: number;
}

export interface ScheduledHourOut {
  price: PriceOut;
}

export interface ChargingRequestCreate {
  hours_needed: number;
  deadline: string;
  charger_power_kw: number;
}

export interface ChargingRequestOut {
  id: number;
  hours_needed: number;
  deadline: string;
  charger_power_kw: number;
  baseline_cost: number;
  optimized_cost: number;
  created_at: string;
  scheduled_hours: ScheduledHourOut[];
}
