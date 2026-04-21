import { create } from 'zustand';
import { fetchStations, fetchBikes, fetchRevenue, fetchDatasetStats } from '../lib/api';
import { getSocket } from '../lib/socket';

export const useAppStore = create((set, get) => ({
  // ─── Auth ────────────────────────────────────────────────
  isAuthenticated: !!localStorage.getItem('velo_auth'),
  user: localStorage.getItem('velo_auth')
    ? JSON.parse(localStorage.getItem('velo_auth'))
    : null,

  login: (email, name) => {
    const user = { email, name: name || email.split('@')[0] };
    localStorage.setItem('velo_auth', JSON.stringify(user));
    set({ isAuthenticated: true, user });
  },

  logout: () => {
    localStorage.removeItem('velo_auth');
    localStorage.removeItem('velo_session');
    set({ isAuthenticated: false, user: null });
  },

  // ─── Sidebar ─────────────────────────────────────────────
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ─── Stations & Bikes ────────────────────────────────────
  stations: [],
  bikes: [],
  revenue: [],
  datasetStats: null,
  predictions: null,
  weather: { type: 'clear', label: 'Clear Sky', temp: 22, humidity: 45, icon: '☀️' },

  loadStations: async () => {
    try {
      const data = await fetchStations();
      set({ stations: data });
    } catch (e) { console.error('Failed to load stations', e); }
  },

  loadBikes: async () => {
    try {
      const data = await fetchBikes();
      set({ bikes: data });
    } catch (e) { console.error('Failed to load bikes', e); }
  },

  loadRevenue: async () => {
    try {
      const data = await fetchRevenue();
      set({ revenue: data, liveRevenue: data });
    } catch (e) { console.error('Failed to load revenue', e); }
  },

  loadDatasetStats: async () => {
    try {
      const data = await fetchDatasetStats();
      set({ datasetStats: data });
    } catch (e) { console.error('Failed to load dataset stats', e); }
  },

  // ─── Real-time Updates ───────────────────────────────────
  initLiveUpdates: () => {
    const socket = getSocket();

    socket.on('system_update', (data) => {
      if (data.stations) set({ stations: data.stations });
      if (data.weather) set({ weather: data.weather });
      if (data.bikes) set({ bikes: data.bikes });
      if (data.alert) {
        const alert = {
          id: Date.now().toString(),
          message: data.alert,
          type: 'warning',
          time: new Date().toLocaleTimeString(),
          read: false,
        };
        set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 50) }));
      }
      if (data.revenue) {
        set({ liveRevenue: data.revenue });
      }
    });

    socket.on('demand_prediction', (data) => {
      set({ predictions: data });
    });

    socket.on('alert', (data) => {
      const alert = {
        id: Date.now().toString(),
        message: data.message,
        type: data.type || 'info',
        time: new Date().toLocaleTimeString(),
        read: false,
      };
      set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 50) }));
    });
  },

  // ─── Alerts ──────────────────────────────────────────────
  alerts: [
    { id: '1', message: '🚨 Electronic City critically low (4/25)', type: 'critical', time: '12:05 PM', read: false },
    { id: '2', message: '📦 HSR Layout nearly full (58/60)',          type: 'info',     time: '12:03 PM', read: false },
    { id: '3', message: '🚨 Demand spike detected near Koramangala',  type: 'critical', time: '11:58 AM', read: false },
    { id: '4', message: '✅ Rebalancing complete: Indiranagar',        type: 'success',  time: '11:45 AM', read: true  },
  ],
  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 50) })),

  // ─── Chat ────────────────────────────────────────────────
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  // ─── Live Revenue ────────────────────────────────────────
  liveRevenue: { daily: 4850, hourly_rate: 202, rides_count: 312 },
}));
