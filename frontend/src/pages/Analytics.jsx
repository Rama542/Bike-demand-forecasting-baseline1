import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { getPricing } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, CloudRain, Sun, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ForecastChart from '../components/ForecastChart';
import HologramCard from '../components/HologramCard';

const COLORS = ['#00F5FF', '#34d399', '#fbbf24', '#8B5CF6', '#f43f5e', '#fb923c'];

const glassTooltipStyle = {
  background: 'rgba(8,12,24,0.95)',
  border: '1px solid rgba(0,245,255,0.2)',
  borderRadius: 10,
  fontSize: '0.78rem',
  boxShadow: '0 0 20px rgba(0,245,255,0.12)',
  backdropFilter: 'blur(20px)',
};

const tabVariants = {
  initial: { opacity: 0, x: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, x: -20, filter: 'blur(4px)', transition: { duration: 0.2 } },
};

export default function Analytics() {
  const stations     = useAppStore((s) => s.stations);
  const revenue      = useAppStore((s) => s.revenue);
  const datasetStats = useAppStore((s) => s.datasetStats);
  const [pricing, setPricing] = useState([]);
  const [activeTab, setActiveTab] = useState('revenue');

  useEffect(() => {
    if (stations.length > 0) {
      getPricing(stations).then((d) => setPricing(d.pricing || [])).catch(() => {});
    }
  }, [stations]);

  const weatherData = datasetStats?.weatherImpact || [
    { weather: 'Clear',      avgDemand: 205 },
    { weather: 'Cloudy',     avgDemand: 175 },
    { weather: 'Light Rain', avgDemand: 112 },
    { weather: 'Heavy Rain', avgDemand: 74  },
  ];

  const seasonData = datasetStats?.seasonalPattern || [
    { season: 'Spring', avgDemand: 155 },
    { season: 'Summer', avgDemand: 236 },
    { season: 'Fall',   avgDemand: 198 },
    { season: 'Winter', avgDemand: 111 },
  ];

  const monthlyData = (datasetStats?.monthlyTrend || []).slice(-12);

  const revenueData = revenue.length > 0
    ? revenue.map((r) => ({ date: r.date?.slice(5) || '', amount: r.amount || 0, rides: r.rides || 0 }))
    : Array.from({ length: 14 }, (_, i) => ({
        date: `${i + 1}/04`,
        amount: Math.round(2000 + Math.random() * 3000),
        rides: Math.round(200 + Math.random() * 500),
      }));

  const TABS = ['revenue', 'weather', 'pricing', 'forecast'];

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.06em', background: 'linear-gradient(135deg, #00F5FF, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          ANALYTICS & INTELLIGENCE
        </h1>
        <p>Revenue insights, weather impact and dynamic pricing</p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        {TABS.map((tab) => (
          <motion.button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={tabVariants} initial="initial" animate="animate" exit="exit">

          {/* ── Revenue ─────────────────────────────────────────── */}
          {activeTab === 'revenue' && (
            <div>
              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
                {[
                  { label: 'Avg Daily Revenue', value: '$2,850', color: 'amber', icon: DollarSign },
                  { label: 'Avg Daily Rides', value: datasetStats?.totalRecords ? Math.round(datasetStats.totalRecords / 731) : 450, color: 'emerald', icon: TrendingUp },
                  { label: 'Revenue / Bike', value: '$23.75', color: 'cyan', icon: DollarSign },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <HologramCard key={m.label}>
                      <div className={`metric-card ${m.color}`} style={{ border: 'none', background: 'transparent', borderRadius: 14 }}>
                        <div className={`metric-icon ${m.color}`}><Icon size={18} /></div>
                        <div className="metric-label">{m.label}</div>
                        <div className="metric-value">{m.value}</div>
                      </div>
                    </HologramCard>
                  );
                })}
              </div>

              <div className="dashboard-grid grid-2">
                <HologramCard>
                  <div className="card-header"><div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>DAILY REVENUE</div></div>
                  <div className="card-body">
                    <div className="chart-container">
                      <ResponsiveContainer>
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,245,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={glassTooltipStyle} labelStyle={{ color: '#fbbf24', fontFamily: 'JetBrains Mono', fontWeight: 700 }} itemStyle={{ color: '#d8f8ff' }} />
                          <Bar dataKey="amount" fill="url(#amberGrad)" radius={[4, 4, 0, 0]} animationDuration={1200}>
                            <defs>
                              <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
                              </linearGradient>
                            </defs>
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </HologramCard>

                <HologramCard>
                  <div className="card-header"><div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>SEASONAL DEMAND</div></div>
                  <div className="card-body">
                    <div className="chart-container">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={seasonData}
                            dataKey="avgDemand"
                            nameKey="season"
                            cx="50%" cy="50%"
                            innerRadius={58}
                            outerRadius={90}
                            paddingAngle={5}
                            animationBegin={0}
                            animationDuration={1200}
                            label={({ season, percent }) => `${season} ${(percent * 100).toFixed(0)}%`}
                            labelLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                          >
                            {seasonData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={glassTooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </HologramCard>
              </div>

              {monthlyData.length > 0 && (
                <HologramCard style={{ marginTop: 16 }}>
                  <div className="card-header"><div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>MONTHLY DEMAND TREND</div></div>
                  <div className="card-body">
                    <div className="chart-container">
                      <ResponsiveContainer>
                        <LineChart data={monthlyData}>
                          <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#00F5FF" />
                              <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,245,255,0.05)" vertical={false} />
                          <XAxis dataKey="month" stroke="rgba(255,255,255,0.25)" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={glassTooltipStyle} />
                          <Line type="monotone" dataKey="avgDaily" stroke="url(#lineGrad)" strokeWidth={2.5} dot={{ fill: '#00F5FF', r: 4, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#00F5FF', stroke: '#fff', strokeWidth: 2 }} animationDuration={1800} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </HologramCard>
              )}
            </div>
          )}

          {/* ── Weather ─────────────────────────────────────────── */}
          {activeTab === 'weather' && (
            <div className="dashboard-grid grid-2">
              <HologramCard>
                <div className="card-header">
                  <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>WEATHER IMPACT</div>
                  <span className="badge violet">Dataset Analysis</span>
                </div>
                <div className="card-body">
                  <div className="chart-container">
                    <ResponsiveContainer>
                      <BarChart data={weatherData} layout="vertical">
                        <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,245,255,0.05)" />
                        <XAxis type="number" stroke="rgba(255,255,255,0.25)" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="weather" stroke="rgba(255,255,255,0.25)" fontSize={11} width={85} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={glassTooltipStyle} />
                        <Bar dataKey="avgDemand" radius={[0, 4, 4, 0]} animationDuration={1000}>
                          {weatherData.map((_, i) => (
                            <Cell key={i} fill={['#fbbf24', '#8892a8', '#00F5FF', '#f43f5e'][i] || '#00F5FF'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </HologramCard>

              <HologramCard>
                <div className="card-header"><div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>WEATHER INSIGHTS</div></div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {weatherData.map((w, i) => {
                      const icons = [Sun, Sun, CloudRain, CloudRain];
                      const Icon = icons[i] || Sun;
                      const baselineAvg = weatherData[0]?.avgDemand || 200;
                      const change = ((w.avgDemand - baselineAvg) / baselineAvg * 100).toFixed(0);
                      return (
                        <div key={w.weather} className="weather-widget">
                          <Icon size={22} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.weather}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>Avg {w.avgDemand} rides/hr</div>
                          </div>
                          <div className={`metric-change ${Number(change) >= 0 ? 'up' : 'down'}`}>
                            {Number(change) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(change)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </HologramCard>
            </div>
          )}

          {/* ── Pricing ─────────────────────────────────────────── */}
          {activeTab === 'pricing' && (
            <div>
              <HologramCard style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div>
                    <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>AI DYNAMIC PRICING ENGINE</div>
                    <div className="card-subtitle">Real-time pricing recommendations based on demand</div>
                  </div>
                  <span className="badge violet">AI Powered</span>
                </div>
              </HologramCard>
              <div className="pricing-grid">
                {pricing.map((p) => (
                  <HologramCard key={p.station_id}>
                    <div className="pricing-card" style={{ border: 'none', background: 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                        <div className={`pricing-multiplier ${p.multiplier > 1 ? 'up' : p.multiplier < 1 ? 'down' : 'neutral'}`}>
                          {p.multiplier.toFixed(2)}x
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{p.suggestion}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.reason}</div>
                      <div style={{ marginTop: 10 }}>
                        <span className={`badge ${p.severity === 'critical' ? 'rose' : p.severity === 'warning' ? 'amber' : p.severity === 'ok' ? 'emerald' : 'cyan'}`}>
                          {p.severity}
                        </span>
                      </div>
                    </div>
                  </HologramCard>
                ))}
              </div>
            </div>
          )}

          {/* ── Forecast ────────────────────────────────────────── */}
          {activeTab === 'forecast' && <ForecastChart />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
