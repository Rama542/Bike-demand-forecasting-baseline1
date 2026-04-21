// ─── Mock Data for offline/demo mode ──────────────────────────────────────
// Used as fallback when the Node.js backend is unreachable (e.g., Vercel deploy).

export const MOCK_STATIONS = [
  { id: 1,  name: 'MG Road',         lat: 12.9758, lng: 77.6082, current_bikes: 24, capacity: 30, status: 'ok'   },
  { id: 2,  name: 'Koramangala',     lat: 12.9352, lng: 77.6245, current_bikes: 22, capacity: 40, status: 'ok'   },
  { id: 3,  name: 'Indiranagar',     lat: 12.9784, lng: 77.6408, current_bikes: 35, capacity: 40, status: 'high' },
  { id: 4,  name: 'HSR Layout',      lat: 12.9063, lng: 77.6383, current_bikes: 58, capacity: 60, status: 'high' },
  { id: 5,  name: 'Whitefield',      lat: 12.9698, lng: 77.7499, current_bikes: 15, capacity: 35, status: 'ok'   },
  { id: 6,  name: 'Electronic City', lat: 12.8399, lng: 77.6770, current_bikes: 4,  capacity: 25, status: 'low'  },
  { id: 7,  name: 'Jayanagar',       lat: 12.9299, lng: 77.5939, current_bikes: 19, capacity: 30, status: 'ok'   },
  { id: 8,  name: 'Hebbal',          lat: 13.0353, lng: 77.5975, current_bikes: 27, capacity: 35, status: 'ok'   },
];

export const MOCK_BIKES = Array.from({ length: 120 }, (_, i) => {
  const station = MOCK_STATIONS[i % MOCK_STATIONS.length];
  const statuses = ['idle', 'idle', 'idle', 'in-use', 'maintenance'];
  const status = statuses[i % statuses.length];
  const jitter = () => (Math.random() - 0.5) * 0.02;
  return {
    id: i + 1,
    status,
    battery_level: Math.floor(Math.random() * 60) + 40,
    lat: station.lat + jitter(),
    lng: station.lng + jitter(),
    station_id: station.id,
  };
});

export const MOCK_REVENUE = {
  daily: 4850,
  hourly_rate: 202,
  rides_count: 312,
  weekly: [3200, 4100, 3800, 4600, 5100, 4850, 5400],
};

export const MOCK_DATASET_STATS = {
  totalRecords: 17379,
  avgDailyRentals: 4504,
  peakHour: 17,
  seasons: ['Spring', 'Summer', 'Fall', 'Winter'],
  hourlyPattern: Array.from({ length: 24 }, (_, h) => {
    const peakMorning = Math.exp(-0.5 * ((h - 8) / 2) ** 2) * 400;
    const peakEvening = Math.exp(-0.5 * ((h - 17) / 2) ** 2) * 500;
    const base = 80;
    const avg = Math.round(base + peakMorning + peakEvening);
    return {
      hour: h,
      avgDemand: avg,
      avgCasual: Math.round(avg * 0.3),
      avgRegistered: Math.round(avg * 0.7),
    };
  }),
  seasonalPattern: [
    { season: 'Spring', avgDemand: 4200 },
    { season: 'Summer', avgDemand: 5100 },
    { season: 'Fall',   avgDemand: 4800 },
    { season: 'Winter', avgDemand: 2900 },
  ],
  dailyPattern: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    demand: Math.round(3800 + Math.random() * 1800),
    casual: Math.round(900 + Math.random() * 600),
    registered: Math.round(2900 + Math.random() * 1200),
  })),
};

export const MOCK_FORECAST = {
  forecast: [420, 390, 360, 340, 480, 530, 610, 580, 500, 440, 410, 380],
  '1_hour': 420,
  '3_hour': 1150,
  '6_hour': 2680,
};

export const MOCK_REBALANCING = {
  recommendations: [
    { action: 'Move bikes: Electronic City → Whitefield',  amount: 8, priority: 'high'   },
    { action: 'Move bikes: HSR Layout → Koramangala',      amount: 6, priority: 'medium' },
    { action: 'Move bikes: Indiranagar → Whitefield',      amount: 4, priority: 'medium' },
    { action: 'Deploy maintenance crew to E-City',         amount: 2, priority: 'high'   },
  ],
};

export const MOCK_PRICING = {
  pricing: [
    { station_id: 1, name: 'MG Road Hub',         capacity: 30, current_bikes: 24, multiplier: 0.90, suggestion: 'Discount -10%',  reason: 'Abundant supply · incentivise more rides',           severity: 'info',     demand: 22 },
    { station_id: 2, name: 'Koramangala Node',    capacity: 40, current_bikes: 12, multiplier: 1.15, suggestion: 'Surge +15%',     reason: 'High demand zone · limited availability',            severity: 'warning',  demand: 78 },
    { station_id: 3, name: 'Indiranagar Stop',    capacity: 40, current_bikes: 20, multiplier: 1.00, suggestion: 'Standard',        reason: 'Balanced supply and demand',                         severity: 'ok',       demand: 55 },
    { station_id: 4, name: 'HSR Layout',          capacity: 60, current_bikes: 52, multiplier: 0.85, suggestion: 'Discount -15%',  reason: 'Excess supply · encourage rentals',                  severity: 'info',     demand: 20 },
    { station_id: 5, name: 'Whitefield East',     capacity: 35, current_bikes: 6,  multiplier: 1.20, suggestion: 'Surge +20%',     reason: 'Tech park commute hour · high demand',               severity: 'warning',  demand: 83 },
    { station_id: 6, name: 'Jayanagar Metro',     capacity: 30, current_bikes: 18, multiplier: 0.90, suggestion: 'Discount -10%',  reason: 'Low demand · idle bikes',                            severity: 'info',     demand: 15 },
    { station_id: 7, name: 'Electronic City',     capacity: 25, current_bikes: 3,  multiplier: 1.25, suggestion: 'Surge +25%',     reason: 'Critical shortage · rebalancing needed urgently',    severity: 'critical', demand: 96 },
    { station_id: 8, name: 'Hebbal Junction',     capacity: 35, current_bikes: 22, multiplier: 1.00, suggestion: 'Standard',        reason: 'Normal operating conditions',                        severity: 'ok',       demand: 48 },
  ],
};
