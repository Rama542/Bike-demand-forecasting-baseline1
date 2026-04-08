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
  try {
    const res = await api.post('/ai/chat', { query });
    return res.data;
  } catch {
    // Fallback AI response
    const responses = [
      `Based on historical data, demand peaks at 8AM and 5PM. Current utilization is at 72%.`,
      `MG Road station is critically low (8/30 bikes). Recommend immediate rebalancing from HSR Layout.`,
      `Weekend demand typically drops 15% compared to weekdays. Dynamic pricing is adjusted accordingly.`,
      `Electronic City shows consistent low demand. Consider reducing capacity by 5 bikes.`,
    ];
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      source: 'mock',
    };
  }
};

export default api;
