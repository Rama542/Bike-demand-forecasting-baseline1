import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

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

export const fetchStations = async () => {
  const res = await api.get('/stations');
  return res.data;
};

export const fetchBikes = async () => {
  const res = await api.get('/bikes');
  return res.data;
};

export const fetchRevenue = async () => {
  const res = await api.get('/revenue');
  return res.data;
};

export const fetchDatasetStats = async () => {
  const res = await api.get('/dataset/stats');
  return res.data;
};

export const predictDemand = async (history = []) => {
  const res = await api.post('/predict', { history });
  return res.data;
};

export const getRebalancing = async (stations) => {
  const res = await api.post('/rebalance', { stations });
  return res.data;
};

export const getPricing = async (stations) => {
  const res = await api.post('/pricing', { stations });
  return res.data;
};

export const sendChatMessage = async (query) => {
  const res = await api.post('/ai/chat', { query });
  return res.data;
};

export default api;
