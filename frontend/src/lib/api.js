import axios from 'axios';
import {
  MOCK_STATIONS,
  MOCK_BIKES,
  MOCK_REVENUE,
  MOCK_DATASET_STATS,
  MOCK_FORECAST,
  MOCK_REBALANCING,
  MOCK_PRICING,
} from './mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_URL, timeout: 4000 });

// Inject auth token into every request
api.interceptors.request.use((config) => {
  const session = localStorage.getItem('velo_session');
  if (session) {
    try {
      const { access_token } = JSON.parse(session);
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
    } catch {}
  }
  return config;
});

// ─── API calls with mock fallback ────────────────────────────────────────────

export const fetchStations = async () => {
  try {
    const res = await api.get('/stations');
    return res.data;
  } catch {
    console.warn('⚠️  Backend unavailable — using mock stations data');
    return MOCK_STATIONS;
  }
};

export const fetchBikes = async () => {
  try {
    const res = await api.get('/bikes');
    return res.data;
  } catch {
    console.warn('⚠️  Backend unavailable — using mock bikes data');
    return MOCK_BIKES;
  }
};

export const fetchRevenue = async () => {
  try {
    const res = await api.get('/revenue');
    return res.data;
  } catch {
    console.warn('⚠️  Backend unavailable — using mock revenue data');
    return MOCK_REVENUE;
  }
};

export const fetchDatasetStats = async () => {
  try {
    const res = await api.get('/dataset/stats');
    return res.data;
  } catch {
    console.warn('⚠️  Backend unavailable — using mock dataset stats');
    return MOCK_DATASET_STATS;
  }
};

export const predictDemand = async (history = []) => {
  try {
    const res = await api.post('/predict', { history });
    return res.data;
  } catch {
    console.warn('⚠️  Backend unavailable — using mock forecast data');
    return MOCK_FORECAST;
  }
};

export const getRebalancing = async (stations) => {
  try {
    const res = await api.post('/rebalance', { stations });
    return res.data;
  } catch {
    console.warn('⚠️  Backend unavailable — using mock rebalancing data');
    return MOCK_REBALANCING;
  }
};

export const getPricing = async (stations) => {
  try {
    const res = await api.post('/pricing', { stations });
    return res.data;
  } catch {
    console.warn('⚠️  Backend unavailable — using mock pricing data');
    return MOCK_PRICING;
  }
};

export const sendChatMessage = async (query) => {
  // Try Vercel serverless function first (works on production)
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (res.ok) {
      const data = await res.json();
      return { answer: data.answer || data.response, source: data.source };
    }
  } catch {}

  // Fallback: try the local Node.js backend
  try {
    const res = await api.post('/ai/chat', { query });
    return res.data;
  } catch {
    // Final fallback: smart context-aware mock responses
    const q = query.toLowerCase();
    let answer;
    if (q.includes('rebalanc') || q.includes('move') || q.includes('where')) {
      answer = '🔄 **Rebalancing Recommended:** Move 8 bikes from HSR Layout (58/60) to MG Road (8/30) immediately. Also transfer 4 bikes from Indiranagar to Electronic City (4/25) to prevent stock-out. Expected demand surge at Electronic City after 5PM.';
    } else if (q.includes('pric') || q.includes('surge')) {
      answer = '💰 **Pricing Intelligence:** Apply 1.4x surge at MG Road (low supply + high demand). Reduce to ₹12/ride at Electronic City to incentivize usage. Optimized pricing could increase daily revenue by ~18%.';
    } else if (q.includes('demand') || q.includes('forecast') || q.includes('predict')) {
      answer = '📈 **Demand Forecast:** Peak demand at 5PM-8PM today with ~530 rides/hour. Koramangala and Indiranagar will hit 85% capacity. ML model (ARIMA + XGBoost) predicts 4,200 total trips today based on clear weather and weekday pattern.';
    } else if (q.includes('station') || q.includes('busiest')) {
      answer = '🗺️ **Station Intelligence:** Indiranagar is busiest (35/40 bikes active). MG Road is critically low (8/30). Koramangala is well-balanced. HSR Layout near-full (58/60) and needs 6 bikes redistributed.';
    } else if (q.includes('revenue') || q.includes('money')) {
      answer = '💵 **Revenue Report:** ₹4,850 generated today from 312 rides (avg ₹15.5/ride). Hourly rate: ₹202. Weekly trend shows +12% growth. Projected monthly revenue at current rate: ₹1.45 Lakh.';
    } else {
      answer = '🤖 **VeloAI Analysis:** Fleet health is at 72% efficiency. Priority actions: (1) Restock MG Road urgently, (2) Apply surge pricing at high-demand stations, (3) Monitor HSR Layout near-capacity situation. Would you like specific recommendations?';
    }
    return { answer, source: 'mock' };
  }
};

export default api;
