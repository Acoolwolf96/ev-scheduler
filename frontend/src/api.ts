import type {
  ChargingRequestCreate,
  ChargingRequestOut,
  TodayPricesOut,
  PeriodSummaryOut,
  OptimizeChargeRequest,
  ChargingPlanPreview,
  CarbonIntensityOut,
} from './types';

const API_URL = import.meta.env.VITE_API_URL;

export async function createChargingRequest(
  data: ChargingRequestCreate
): Promise<ChargingRequestOut> {
  const response = await fetch(`${API_URL}/charging-requests/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getChargingRequests(): Promise<ChargingRequestOut[]> {
  const response = await fetch(`${API_URL}/charging-requests/`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getTodaysPrices(): Promise<TodayPricesOut> {
  const response = await fetch(`${API_URL}/prices/today`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getSavingsSummary(
  groupBy: 'day' | 'week' | 'month' | 'year'
): Promise<PeriodSummaryOut[]> {
  const response = await fetch(`${API_URL}/charging-requests/summary?group_by=${groupBy}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function previewCharging(
  data: OptimizeChargeRequest
): Promise<ChargingPlanPreview> {
  const response = await fetch(`${API_URL}/charging-requests/optimize/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function confirmCharging(
  data: OptimizeChargeRequest
): Promise<ChargingRequestOut> {
  const response = await fetch(`${API_URL}/charging-requests/optimize/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getCurrentCarbon(): Promise<CarbonIntensityOut> {
  const response = await fetch(`${API_URL}/carbon/current`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}
