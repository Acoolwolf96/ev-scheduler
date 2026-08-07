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
  current_charge_percent: number | null;
  target_charge_percent: number | null;
  battery_capacity_kwh: number | null;
  forecast_low_temp_c: number | null;
  start_time: string | null;
  finish_time: string | null;
}

export interface TodayPricesOut {
  prices: PriceOut[];
  cheapest: PriceOut | null;
}

export interface PeriodSummaryOut {
  period_start: string;
  total_baseline: number;
  total_optimized: number;
  total_saved: number;
  request_count: number;
}

export interface OptimizeChargeRequest {
  current_charge_percent: number;
  target_charge_percent: number;
  battery_capacity_kwh: number;
  charger_power_kw: number;
  departure_time: string;
  place: string;
}

export interface ChargingPlanPreview {
  hours_needed: number;
  baseline_cost: number;
  optimized_cost: number;
  forecast_low_temp_c: number | null;
  start_time: string;
  finish_time: string;
  scheduled_hours: PriceOut[];
}

export type DeparturePreset = 'tonight' | 'tomorrow-morning' | 'tomorrow-evening' | 'custom';

export interface PriceChangeNotice {
  previous: ChargingPlanPreview;
  updated: ChargingRequestOut;
}

export interface HomePlanState {
  currentPercent: number;
  targetPercent: number;
  preset: DeparturePreset;
  departureTime: string;
  preview: ChargingPlanPreview | null;
  lastRequest: OptimizeChargeRequest | null;
  confirmedId: number | null;
  priceChangeNotice: PriceChangeNotice | null;
}

export interface CarbonIntensityOut {
  timestamp: string | null;
  value_gco2_kwh: number | null;
}
