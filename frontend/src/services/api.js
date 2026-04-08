/**
 * Forecast API Service
 * Dedicated service for time series and forecast endpoints.
 * Uses VITE_API_URL env variable for base URL.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiFetch(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown API error');
  return json;
}

/**
 * Fetch the full daily time series from the dataset.
 * Returns: { data: [{ date, value, casual, registered }] }
 */
export async function fetchTimeSeries() {
  return apiFetch('/data/timeseries');
}

const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';

/**
 * Fetch daily predictions from ML backend.
 * Returns: { date: [...], predictions: [...] }
 */
export async function fetchDailyPredictions() {
  const res = await fetch(`${ML_BASE_URL}/predict/daily`);
  if (!res.ok) throw new Error('Failed to fetch daily ML predictions');
  return res.json();
}

/**
 * Fetch weekly aggregated predictions from ML backend.
 * Returns: { date: [...], predictions: [...] }
 */
export async function fetchWeeklyPredictions() {
  const res = await fetch(`${ML_BASE_URL}/predict/weekly`);
  if (!res.ok) throw new Error('Failed to fetch weekly ML predictions');
  return res.json();
}

/**
 * Fetch model metrics (MAE, RMSE, etc.) from ML backend.
 * Returns: { mae_ma: ..., mae_naive: ..., rmse_ma: ..., improvement_pct: ... }
 */
export async function fetchMetrics() {
  const res = await fetch(`${ML_BASE_URL}/api/metrics`);
  if (!res.ok) throw new Error('Failed to fetch ML model metrics');
  return res.json();
}
