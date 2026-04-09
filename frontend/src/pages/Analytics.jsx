import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { getPricing } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CloudRain, Sun, ArrowUpRight, ArrowDownRight, Zap, AlertTriangle, CheckCircle, RefreshCw, Bike } from 'lucide-react';
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
  const [pricingLoading, setPricingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('revenue');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Rich mock pricing data for when backend is unavailable
  const MOCK_PRICING = [
    { station_id: 1, name: 'MG Road Hub',       capacity: 30, current_bikes: 4,  multiplier: 1.25, suggestion: 'Surge +25%', reason: 'Peak-hour demand · critically low inventory',      severity: 'critical', demand: 92 },
    { station_id: 2, name: 'Koramangala Node',  capacity: 40, current_bikes: 8,  multiplier: 1.15, suggestion: 'Surge +15%', reason: 'High demand zone · limited availability',          severity: 'warning',  demand: 78 },
    { station_id: 3, name: 'Indiranagar Stop',  capacity: 25, current_bikes: 13, multiplier: 1.00, suggestion: 'Standard',   reason: 'Balanced supply and demand',                      severity: 'ok',       demand: 55 },
    { station_id: 4, name: 'HSR Layout',        capacity: 60, current_bikes: 52, multiplier: 0.85, suggestion: 'Discount -15%', reason: 'Excess supply · encourage rentals',           severity: 'info',     demand: 20 },
    { station_id: 5, name: 'Whitefield East',   capacity: 35, current_bikes: 6,  multiplier: 1.20, suggestion: 'Surge +20%', reason: 'Tech park commute hour · high demand',          severity: 'warning',  demand: 83 },
    { station_id: 6, name: 'Jayanagar Metro',   capacity: 20, current_bikes: 18, multiplier: 0.90, suggestion: 'Discount -10%', reason: 'Low demand · idle bikes',                  severity: 'info',     demand: 15 },
    { station_id: 7, name: 'Electronic City',   capacity: 50, current_bikes: 3,  multiplier: 1.25, suggestion: 'Surge +25%', reason: 'Critical shortage · rebalancing needed urgently', severity: 'critical', demand: 96 },
    { station_id: 8, name: 'Marathahalli Gate', capacity: 45, current_bikes: 22, multiplier: 1.00, suggestion: 'Standard',   reason: 'Normal operating conditions',                     severity: 'ok',       demand: 48 },
  ];

  const loadPricing = useCallback(async () => {
    setPricingLoading(true);
    try {
      if (stations.length > 0) {
        const d = await getPricing(stations);
        setPricing(d.pricing || []);
      } else {
        // Use mock data with slight random variance to simulate live updates
        const withVariance = MOCK_PRICING.map(p => ({
          ...p,
          demand: Math.min(100, Math.max(5, p.demand + Math.round((Math.random() - 0.5) * 8))),
          current_bikes: Math.max(1, p.current_bikes + Math.round((Math.random() - 0.5) * 2)),
        }));
        setPricing(withVariance);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setPricing(MOCK_PRICING);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setPricingLoading(false);
    }
  }, [stations]);

  useEffect(() => {
    if (activeTab === 'pricing') loadPricing();
  }, [activeTab, loadPricing]);

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

  // 30 days of revenue data — always visible with realistic mock fallback
  const revenueData = (() => {
    if (revenue.length > 0) {
      return revenue.slice(-30).map((r) => ({
        date: r.date?.slice(5) || '',
        amount: r.amount || 0,
        rides: r.rides || 0,
      }));
    }
    // Mock: last 30 days with seasonal patterns
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const month = d.getMonth();
      const seasonal = [2200, 2400, 3200, 3800, 4500, 5100, 5300, 5200, 4600, 3900, 3100, 2400][month];
      const amount = Math.max(800, Math.round(seasonal + (Math.random() - 0.5) * 800));
      return {
        date: `${String(d.getMonth() + 1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`,
        amount,
        rides: Math.round(amount / 3.5),
      };
    });
  })();

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
                  <div className="card-header">
                    <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>DAILY REVENUE</div>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>Last 30 days</span>
                  </div>
                  <div className="card-body">
                    <div style={{ height: 260, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                          <defs>
                            <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                              <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={9}
                            fontFamily="JetBrains Mono"
                            tickLine={false}
                            axisLine={false}
                            interval={4}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={9}
                            fontFamily="JetBrains Mono"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`}
                          />
                          <Tooltip
                            contentStyle={glassTooltipStyle}
                            labelStyle={{ color: '#fbbf24', fontFamily: 'JetBrains Mono', fontWeight: 700 }}
                            itemStyle={{ color: '#fbbf24' }}
                            formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                            cursor={{ fill: 'rgba(251,191,36,0.06)' }}
                          />
                          <Bar
                            dataKey="amount"
                            name="Revenue"
                            fill="url(#amberGrad)"
                            radius={[4, 4, 0, 0]}
                            animationDuration={1000}
                            animationEasing="ease-out"
                            maxBarSize={24}
                          />
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
              {/* Header Banner */}
              <HologramCard glowColor="#8B5CF6" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div>
                    <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.06em', background: 'linear-gradient(90deg, #8B5CF6, #00F5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      ⚡ AI DYNAMIC PRICING ENGINE
                    </div>
                    <div className="card-subtitle">Real-time surge pricing based on station inventory &amp; demand signals</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {lastUpdated && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>Updated {lastUpdated}</span>}
                    <button
                      onClick={loadPricing}
                      disabled={pricingLoading}
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                    >
                      <RefreshCw size={12} style={{ animation: pricingLoading ? 'spin 1s linear infinite' : 'none' }} />
                      Recalculate
                    </button>
                    <span className="badge violet">AI Powered</span>
                  </div>
                </div>

                {/* Summary Stats */}
                <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 4 }}>
                  {[
                    { label: 'Surge Zones',    value: pricing.filter(p => p.multiplier > 1).length,   color: '#f43f5e', icon: TrendingUp   },
                    { label: 'Discount Zones', value: pricing.filter(p => p.multiplier < 1).length,   color: '#34d399', icon: TrendingDown },
                    { label: 'Normal Zones',   value: pricing.filter(p => p.multiplier === 1).length, color: '#00F5FF', icon: CheckCircle  },
                    { label: 'Critical',       value: pricing.filter(p => p.severity === 'critical').length, color: '#fbbf24', icon: AlertTriangle },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${m.color}22`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={16} color={m.color} />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: m.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{m.value}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </HologramCard>

              {/* Station Cards Grid */}
              {pricingLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'rgba(139,92,246,0.6)' }}>
                  <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Calculating optimal prices…</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {pricing.map((p, idx) => {
                    const isSurge    = p.multiplier > 1;
                    const isDiscount = p.multiplier < 1;
                    const accentColor = p.severity === 'critical' ? '#f43f5e' : p.severity === 'warning' ? '#fbbf24' : p.severity === 'ok' ? '#34d399' : '#00F5FF';
                    const basePrice = 3.50;
                    const finalPrice = (basePrice * p.multiplier).toFixed(2);
                    const demandPct = p.demand ?? Math.round((1 - (p.current_bikes / p.capacity)) * 100);

                    return (
                      <motion.div
                        key={p.station_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
                      >
                        <HologramCard glowColor={accentColor}>
                          <div style={{ padding: '16px 18px' }}>
                            {/* Station Name + Severity Badge */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                                  <Bike size={13} color={accentColor} />
                                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{p.name}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                                  {p.current_bikes ?? '—'} / {p.capacity ?? '—'} bikes available
                                </div>
                              </div>
                              <span style={{
                                padding: '3px 9px', borderRadius: 20, fontSize: '10px', fontWeight: 700,
                                fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                                background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44`,
                              }}>
                                {p.severity}
                              </span>
                            </div>

                            {/* Demand Bar */}
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demand Level</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: accentColor, fontFamily: 'var(--font-mono)' }}>{demandPct}%</span>
                              </div>
                              <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${demandPct}%` }}
                                  transition={{ duration: 0.8, delay: idx * 0.06, ease: 'easeOut' }}
                                  style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` }}
                                />
                              </div>
                            </div>

                            {/* Price Display */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, border: `1px solid ${accentColor}20` }}>
                              <div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>BASE → CURRENT</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: isSurge ? 'line-through' : 'none', fontFamily: 'var(--font-mono)' }}>${basePrice.toFixed(2)}</span>
                                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>→</span>
                                  <span style={{ fontSize: '20px', fontWeight: 800, color: accentColor, fontFamily: 'var(--font-display)' }}>${finalPrice}</span>
                                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>/ride</span>
                                </div>
                              </div>
                              <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                background: `${accentColor}15`, border: `1px solid ${accentColor}33`,
                                borderRadius: 8, padding: '6px 10px', minWidth: 52,
                              }}>
                                {isSurge ? <TrendingUp size={14} color={accentColor} /> : isDiscount ? <TrendingDown size={14} color={accentColor} /> : <CheckCircle size={14} color={accentColor} />}
                                <span style={{ fontSize: '14px', fontWeight: 800, color: accentColor, fontFamily: 'var(--font-display)', marginTop: 2 }}>{p.multiplier.toFixed(2)}x</span>
                              </div>
                            </div>

                            {/* Suggestion + Reason */}
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>{p.suggestion}</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>{p.reason}</div>
                          </div>
                        </HologramCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Forecast ────────────────────────────────────────── */}
          {activeTab === 'forecast' && <ForecastChart />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
