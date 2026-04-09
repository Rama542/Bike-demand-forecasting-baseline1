/**
 * Forecast API Service
 * Dedicated service for time series and forecast endpoints.
 * Falls back to realistic mock data when the ML backend is unavailable (e.g. Vercel).
 */

const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';

// ─── Mock Data Generators ─────────────────────────────────────────────────────
// Based on real UCI Bike Sharing Dataset patterns (2011-2012, Washington D.C.)

function generateDailyMockData() {
  // 731 days of bike rental data with seasonal + weekly patterns
  const startDate = new Date('2011-01-01');
  const dates = [];
  const predictions = [];

  for (let i = 0; i < 100; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i * 7); // weekly samples
    const month = d.getMonth(); // 0-11
    // Seasonal baseline: low winter, high summer
    const seasonal = [2200, 2400, 3200, 3800, 4500, 5100, 5300, 5200, 4600, 3900, 3100, 2400][month];
    const noise = (Math.random() - 0.5) * 600;
    const trend = i * 3; // slight upward trend over 2 years
    const value = Math.max(500, Math.round(seasonal + noise + trend));

    dates.push(d.toISOString().slice(0, 10));
    predictions.push(value);
  }
  return { date: dates, predictions };
}

function generateWeeklyMockData() {
  const baseWeekly = [
    { week: 1, val: 18200 }, { week: 2, val: 19400 }, { week: 3, val: 21000 },
    { week: 4, val: 22500 }, { week: 5, val: 24100 }, { week: 6, val: 25800 },
    { week: 7, val: 27200 }, { week: 8, val: 28500 }, { week: 9, val: 29100 },
    { week: 10, val: 30400 }, { week: 11, val: 31200 }, { week: 12, val: 32100 },
    { week: 13, val: 34500 }, { week: 14, val: 35200 }, { week: 15, val: 36100 },
    { week: 16, val: 37400 }, { week: 17, val: 38000 }, { week: 18, val: 39200 },
    { week: 19, val: 40100 }, { week: 20, val: 41000 },
  ];

  const startDate = new Date('2011-01-01');
  return {
    date: baseWeekly.map((_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i * 7);
      return `Week ${i + 1}`;
    }),
    predictions: baseWeekly.map(w => w.val + Math.round((Math.random() - 0.5) * 1200)),
  };
}

const MOCK_METRICS = {
  mae_ma: '412.3',
  mae_naive: '681.5',
  rmse_ma: '587.2',
  improvement_pct: '39.5',
};

// ─── API Functions with Mock Fallback ────────────────────────────────────────

/**
 * Fetch daily predictions from ML backend.
 * Falls back to mock data if backend unavailable.
 */
export async function fetchDailyPredictions() {
  try {
    const res = await fetch(`${ML_BASE_URL}/predict/daily`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Failed to fetch daily ML predictions');
    return res.json();
  } catch {
    console.warn('⚠️  ML backend unavailable — using mock daily forecast data');
    return generateDailyMockData();
  }
}

/**
 * Fetch weekly aggregated predictions from ML backend.
 * Falls back to mock data if backend unavailable.
 */
export async function fetchWeeklyPredictions() {
  try {
    const res = await fetch(`${ML_BASE_URL}/predict/weekly`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Failed to fetch weekly ML predictions');
    return res.json();
  } catch {
    console.warn('⚠️  ML backend unavailable — using mock weekly forecast data');
    return generateWeeklyMockData();
  }
}

/**
 * Fetch model metrics (MAE, RMSE, etc.) from ML backend.
 * Falls back to realistic mock metrics if backend unavailable.
 */
export async function fetchMetrics() {
  try {
    const res = await fetch(`${ML_BASE_URL}/api/metrics`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Failed to fetch ML model metrics');
    return res.json();
  } catch {
    console.warn('⚠️  ML backend unavailable — using mock ML metrics');
    return MOCK_METRICS;
  }
}

/**
 * Fetch daily revenue data from ML backend.
 * Returns 30 days of revenue + ride counts.
 * Falls back to generated mock data if backend unavailable.
 */
export async function fetchDailyRevenue() {
  try {
    const res = await fetch(`${ML_BASE_URL}/predict/revenue/daily`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Failed to fetch daily revenue');
    return res.json();
  } catch {
    console.warn('⚠️  ML backend unavailable — using mock daily revenue data');
    const today = new Date();
    const dates = [], revenues = [], rides = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const month = d.getMonth();
      const seasonal = [2200, 2400, 3200, 3800, 4500, 5100, 5300, 5200, 4600, 3900, 3100, 2400][month];
      const dayRides = Math.max(200, Math.round(seasonal + (Math.random() - 0.5) * 600));
      dates.push(d.toISOString().slice(0, 10));
      rides.push(dayRides);
      revenues.push(Math.round(dayRides * 3.5));
    }
    return { date: dates, revenue: revenues, rides };
  }
}

/**
 * Fetch the full daily time series from the dataset.
 */
export async function fetchTimeSeries() {
  try {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const res = await fetch(`${BASE_URL}/data/timeseries`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  } catch {
    console.warn('⚠️  Backend unavailable — using mock time series data');
    const mock = generateDailyMockData();
    return { success: true, data: mock.date.map((d, i) => ({ date: d, value: mock.predictions[i] })) };
  }
}
