/**
 * Forecast API Service
 * =====================
 * Reads pre-processed JSON files built from the real UCI Bike Sharing Dataset
 * (day.csv / hour.csv — 731 daily + 17,379 hourly records).
 *
 * The JSON files live in /frontend/public/data/ and are served as static
 * assets by Vercel — no backend server required.
 */

const BASE = '/data';

// ── Generic fetch-with-fallback ────────────────────────────────────────────────
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

/**
 * Fetch daily predictions (7-day SMA on real day.csv).
 * Response: { date: string[], predictions: number[] }
 */
export async function fetchDailyPredictions() {
  try {
    return await fetchJson(`${BASE}/daily.json`);
  } catch (e) {
    console.warn('fetchDailyPredictions failed:', e.message);
    return { date: [], predictions: [] };
  }
}

/**
 * Fetch weekly aggregated totals (real day.csv, grouped by ISO week).
 * Response: { date: string[], predictions: number[] }
 */
export async function fetchWeeklyPredictions() {
  try {
    return await fetchJson(`${BASE}/weekly.json`);
  } catch (e) {
    console.warn('fetchWeeklyPredictions failed:', e.message);
    return { date: [], predictions: [] };
  }
}

/**
 * Fetch model performance metrics (MAE, RMSE vs naive baseline).
 * Response: { mae_ma, mae_naive, rmse_ma, improvement_pct, total_rides, total_records }
 */
export async function fetchMetrics() {
  try {
    return await fetchJson(`${BASE}/metrics.json`);
  } catch (e) {
    console.warn('fetchMetrics failed:', e.message);
    return { mae_ma: 0, mae_naive: 0, rmse_ma: 0, improvement_pct: 0, total_rides: 0, total_records: 0 };
  }
}

/**
 * Fetch last 30 days of revenue computed from real day.csv (₹280/ride).
 * Response: { date: string[], rides: number[], revenue: number[] }
 */
export async function fetchDailyRevenue() {
  try {
    return await fetchJson(`${BASE}/revenue.json`);
  } catch (e) {
    console.warn('fetchDailyRevenue failed:', e.message);
    return { date: [], rides: [], revenue: [] };
  }
}

/**
 * Fetch hourly demand pattern averaged over full 2-year dataset.
 * Response: { hour: string[], demand: number[], casual: number[], registered: number[] }
 */
export async function fetchHourlyPattern() {
  try {
    return await fetchJson(`${BASE}/hourly.json`);
  } catch (e) {
    console.warn('fetchHourlyPattern failed:', e.message);
    return { hour: [], demand: [], casual: [], registered: [] };
  }
}

/**
 * Fetch full dataset stats — used by appStore for Dashboard charts.
 * Response: { totalRecords, avgDailyRentals, peakHour, hourlyPattern, seasonalPattern, dailyPattern }
 */
export async function fetchDatasetStats() {
  try {
    return await fetchJson(`${BASE}/dataset-stats.json`);
  } catch (e) {
    console.warn('fetchDatasetStats failed:', e.message);
    return null;
  }
}

/**
 * @deprecated — full time series (use fetchDailyPredictions instead)
 */
export async function fetchTimeSeries() {
  const data = await fetchDailyPredictions();
  return {
    success: true,
    data: data.date.map((d, i) => ({ date: d, value: data.predictions[i] })),
  };
}
