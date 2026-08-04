import type { ChargingRequestCreate, ChargingRequestOut } from './types';

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
