/**
 * lib/api.js — VeloAI Frontend API Layer
 * ========================================
 * All data comes from pre-processed real UCI Bike Sharing Dataset JSON files
 * served as static assets from /public/data/*.json — no backend server needed.
 *
 * Dynamic endpoints (stations, rebalancing, pricing) use rich mock data
 * seeded from dataset patterns since the UCI dataset has no GPS/station data.
 */

import {
  MOCK_STATIONS,
  MOCK_BIKES,
  MOCK_REVENUE,
  MOCK_FORECAST,
  MOCK_REBALANCING,
  MOCK_PRICING,
} from './mockData';

const BASE = '/data';

// ── Generic fetch helper ───────────────────────────────────────────────────────
async function getJson(file) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${file}`);
  return res.json();
}

// ── Station data (mock — UCI has no GPS station info) ─────────────────────────
export const fetchStations = async () => MOCK_STATIONS;

export const fetchBikes = async () => MOCK_BIKES;

// ── Revenue — from real day.csv (pre-processed to revenue.json) ───────────────
export const fetchRevenue = async () => {
  try {
    const data = await getJson('revenue.json');
    // Return summary object matching the revenue store shape
    const total = data.revenue.reduce((s, v) => s + v, 0);
    const lastDay = data.revenue[data.revenue.length - 1] || 0;
    return {
      daily: lastDay,
      hourly_rate: Math.round(lastDay / 18),
      rides_count: data.rides[data.rides.length - 1] || 0,
      total: total,
    };
  } catch {
    console.warn('fetchRevenue: using fallback');
    return MOCK_REVENUE;
  }
};

// ── Dataset stats — from real hour.csv + day.csv (dataset-stats.json) ─────────
export const fetchDatasetStats = async () => {
  try {
    return await getJson('dataset-stats.json');
  } catch {
    console.warn('fetchDatasetStats: using fallback');
    // Build from the static MOCK_DATASET_STATS as last resort
    return null;
  }
};

// ── Demand forecast — computed from real 7-day SMA on day.csv ────────────────
export const predictDemand = async () => {
  try {
    const daily = await getJson('daily.json');
    // Return in the shape the Dashboard expects
    const last12 = daily.predictions.slice(-12);
    return {
      forecast: last12,
      '1_hour':  last12[0]  || 0,
      '3_hour':  last12.slice(0, 3).reduce((a, b) => a + b, 0),
      '6_hour':  last12.slice(0, 6).reduce((a, b) => a + b, 0),
    };
  } catch {
    console.warn('predictDemand: using fallback');
    return MOCK_FORECAST;
  }
};

// ── Rebalancing recommendations (smart mock using station states) ──────────────
export const getRebalancing = async (stations) => {
  const overfull = stations.filter(s => s.current_bikes / s.capacity > 0.8);
  const critical = stations.filter(s => s.current_bikes / s.capacity < 0.2);
  const recs = [];

  for (let i = 0; i < Math.min(overfull.length, critical.length); i++) {
    const from = overfull[i];
    const to = critical[i];
    const amount = Math.min(
      Math.floor((from.current_bikes - from.capacity * 0.5)),
      Math.ceil(to.capacity * 0.5 - to.current_bikes)
    );
    if (amount > 0) {
      recs.push({
        from_station: from.name,
        to_station: to.name,
        action: `Move bikes: ${from.name} → ${to.name}`,
        amount,
        priority: to.current_bikes <= 3 ? 'high' : 'medium',
      });
    }
  }

  return { recommendations: recs.length > 0 ? recs : MOCK_REBALANCING.recommendations };
};

// ── Dynamic pricing (demand-driven mock) ──────────────────────────────────────
export const getPricing = async (stations) => {
  if (!stations || stations.length === 0) return MOCK_PRICING;

  const pricing = stations.map(st => {
    const ratio = st.current_bikes / st.capacity;
    let multiplier, suggestion, reason, severity;

    if (ratio < 0.2) {
      multiplier = 1.25; suggestion = 'Surge +25%'; severity = 'critical';
      reason = `Critical shortage (${st.current_bikes}/${st.capacity}) · high demand zone`;
    } else if (ratio < 0.4) {
      multiplier = 1.15; suggestion = 'Surge +15%'; severity = 'warning';
      reason = `Low availability · demand likely exceeds supply`;
    } else if (ratio > 0.85) {
      multiplier = 0.85; suggestion = 'Discount -15%'; severity = 'info';
      reason = `Excess supply (${st.current_bikes}/${st.capacity}) · incentivise rides`;
    } else if (ratio > 0.7) {
      multiplier = 0.90; suggestion = 'Discount -10%'; severity = 'info';
      reason = `High inventory · encourage usage`;
    } else {
      multiplier = 1.00; suggestion = 'Standard'; severity = 'ok';
      reason = `Balanced supply and demand`;
    }

    const basePrice = 20;
    const demand = Math.round((1 - ratio) * 100);
    return {
      station_id: st.id,
      name: st.name,
      capacity: st.capacity,
      current_bikes: st.current_bikes,
      multiplier,
      suggestion,
      reason,
      severity,
      demand,
      price: Math.round(basePrice * multiplier),
    };
  });

  return { pricing };
};

// ── AI Chat — Vercel serverless, then smart mock ───────────────────────────────
export const sendChatMessage = async (query) => {
  // Try Vercel serverless function (works on production)
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
  } catch { /* fall through */ }

  // Smart context-aware fallback
  const q = query.toLowerCase();
  let answer;
  if (q.includes('rebalanc') || q.includes('move') || q.includes('where')) {
    answer = '🔄 **Rebalancing Recommended:** Move 8 bikes from HSR Layout (58/60) to MG Road immediately. Also transfer 4 bikes from Indiranagar to Electronic City (4/25) to prevent stock-out. Expected demand surge at Electronic City after 5PM.';
  } else if (q.includes('pric') || q.includes('surge')) {
    answer = '💰 **Pricing Intelligence:** Apply 1.4x surge at MG Road (low supply + high demand). Reduce to ₹12/ride at Electronic City to incentivize usage. Optimized pricing could increase daily revenue by ~18%.';
  } else if (q.includes('demand') || q.includes('forecast') || q.includes('predict')) {
    answer = '📈 **Demand Forecast:** Peak demand at 5PM–8PM today with ~530 rides/hour. Koramangala and Indiranagar will hit 85% capacity. Based on UCI dataset patterns (4,504 avg daily rides).';
  } else if (q.includes('station') || q.includes('busiest')) {
    answer = '🗺️ **Station Intelligence:** Indiranagar is busiest (35/40 bikes). MG Road is critically low (8/30). Koramangala is well-balanced. HSR Layout near-full (58/60) and needs 6 bikes redistributed.';
  } else if (q.includes('revenue') || q.includes('money')) {
    answer = '💵 **Revenue Report:** ₹4,850 generated today from 312 rides (avg ₹15.5/ride). Projected monthly revenue at current rate: ₹1.45 Lakh. Dataset shows peak revenue in Summer months.';
  } else {
    answer = '🤖 **VeloAI Analysis:** Fleet health at 72% efficiency. Priority actions: (1) Restock MG Road, (2) Apply surge pricing at high-demand stations, (3) Monitor HSR Layout capacity. Ask me anything specific!';
  }
  return { answer, source: 'mock' };
};

export default { fetchStations, fetchBikes, fetchRevenue, fetchDatasetStats, predictDemand, getRebalancing, getPricing, sendChatMessage };
