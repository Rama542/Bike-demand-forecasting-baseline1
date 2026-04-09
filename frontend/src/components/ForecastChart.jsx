import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart,
} from 'recharts';
import { RefreshCw, TrendingUp, Target, Activity, DollarSign, Bike } from 'lucide-react';
import { fetchDailyPredictions, fetchWeeklyPredictions, fetchMetrics, fetchDailyRevenue } from '../services/api';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(8,12,24,0.97)',
    border: '1px solid rgba(0,245,255,0.25)',
    borderRadius: '10px',
    fontSize: '12px',
    boxShadow: '0 0 20px rgba(0,245,255,0.1)',
    backdropFilter: 'blur(20px)',
  },
  labelStyle: { color: '#00F5FF', fontFamily: 'JetBrains Mono', fontWeight: 700 },
  itemStyle: { color: '#d8f8ff' },
};

// ── Daily Revenue Chart ─────────────────────────────────────────
function DailyRevenueChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgRevenue, setAvgRevenue] = useState(0);
  const [totalRides, setTotalRides] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDailyRevenue();
      const formatted = res.date.map((d, i) => ({
        date: d.slice(5), // MM-DD
        revenue: res.revenue[i],
        rides: res.rides?.[i] || 0,
      }));
      setData(formatted);
      const total = res.revenue.reduce((a, b) => a + b, 0);
      setTotalRevenue(total);
      setAvgRevenue(Math.round(total / res.revenue.length));
      setTotalRides(res.rides ? res.rides.reduce((a, b) => a + b, 0) : 0);
    } catch (e) {
      console.error('Revenue chart error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 340, color: 'rgba(0,245,255,0.5)' }}>
      <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
      <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading revenue data…</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Revenue KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: '30-Day Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#fbbf24', glow: '#fbbf2440' },
          { label: 'Avg Daily Revenue', value: `$${avgRevenue.toLocaleString()}`, icon: TrendingUp, color: '#34d399', glow: '#34d39940' },
          { label: 'Total Rides', value: totalRides.toLocaleString(), icon: Bike, color: '#00F5FF', glow: '#00F5FF40' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${m.glow}`,
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: `0 0 20px ${m.glow}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon size={15} color={m.color} />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                  {m.label}
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: m.color, fontFamily: 'var(--font-display)' }}>
                {m.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Area Chart */}
      <div style={{ height: 260, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ridesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00F5FF" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
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
              yAxisId="revenue"
              stroke="rgba(255,255,255,0.2)"
              fontSize={10}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            />
            <YAxis
              yAxisId="rides"
              orientation="right"
              stroke="rgba(255,255,255,0.15)"
              fontSize={9}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(val, name) => name === 'revenue' ? [`$${val.toLocaleString()}`, 'Revenue'] : [val.toLocaleString(), 'Rides']}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono' }}
            />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              name="Revenue ($)"
              stroke="#fbbf24"
              fill="url(#revenueGrad)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1800}
            />
            <Area
              yAxisId="rides"
              type="monotone"
              dataKey="rides"
              name="Rides"
              stroke="#00F5FF"
              fill="url(#ridesGrad)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00F5FF', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={2200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Demand Predictions Chart ────────────────────────────────────
function PredictionsChart({ viewMode }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = viewMode === 'daily'
        ? await fetchDailyPredictions()
        : await fetchWeeklyPredictions();

      if (!res || !res.date || !res.predictions) throw new Error('Invalid data format');

      const formatted = res.date.map((d, i) => ({
        date: viewMode === 'daily' ? String(d).slice(5) : String(d),
        predictions: Number(res.predictions[i]) || 0,
      }));
      setChartData(formatted);
    } catch (e) {
      setError('Failed to load forecast data.');
    } finally {
      setLoading(false);
    }
  }, [viewMode, refreshKey]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 seconds
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setRefreshKey(k => k + 1), 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'rgba(0,245,255,0.5)' }}>
      <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
      <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading forecast data…</span>
    </div>
  );

  if (error || chartData.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#f43f5e', flexDirection: 'column', gap: 8 }}>
      <TrendingUp size={32} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error || 'No forecast data available.'}</span>
    </div>
  );

  return (
    <div style={{ height: 300, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastGradFix" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.2)"
            fontSize={9}
            fontFamily="JetBrains Mono"
            tickLine={false}
            axisLine={false}
            interval={viewMode === 'daily' ? 9 : 0}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            fontSize={10}
            fontFamily="JetBrains Mono"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono' }} />
          <Area
            type="monotone"
            dataKey="predictions"
            name="ML Demand Forecast"
            stroke="#8B5CF6"
            fill="url(#forecastGradFix)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={1800}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Exported Component ────────────────────────────────────
export default function ForecastChart() {
  const [viewMode, setViewMode] = useState('daily');
  const [activeView, setActiveView] = useState('revenue'); // 'revenue' | 'forecast'
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics()
      .then(setMetrics)
      .catch((err) => console.error('Could not fetch metrics', err));
  }, [triggerRefresh]);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="card-header" style={{ borderBottom: '1px solid rgba(0,245,255,0.07)', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="card-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            letterSpacing: '0.06em',
            background: 'linear-gradient(90deg, #fbbf24, #f43f5e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {activeView === 'revenue' ? '💰 DAILY REVENUE TRACKER' : '📈 ML DEMAND FORECAST'}
          </div>
          <div className="card-subtitle" style={{ fontSize: '0.7rem', marginTop: 2 }}>
            {activeView === 'revenue'
              ? 'Last 30 days — revenue & rides from dataset'
              : viewMode === 'daily' ? 'Daily ML demand predictions' : 'Weekly aggregated ML forecast'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            {[['revenue', '💰 Revenue'], ['forecast', '📈 Forecast']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                style={{
                  padding: '5px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border: 'none',
                  background: activeView === v ? 'rgba(0,245,255,0.15)' : 'transparent',
                  color: activeView === v ? '#00F5FF' : 'rgba(255,255,255,0.4)',
                  borderRight: v === 'revenue' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {activeView === 'forecast' && (
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#c8d0e0',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <option value="daily">Daily View</option>
              <option value="weekly">Weekly View</option>
            </select>
          )}

          <button
            onClick={() => setTriggerRefresh((k) => k + 1)}
            title="Refresh data"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#c8d0e0',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RefreshCw size={12} />
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>Refresh</span>
          </button>
        </div>
      </div>

      <div className="card-body" style={{ padding: '16px 20px' }}>
        {activeView === 'revenue' && <DailyRevenueChart key={`rev-${triggerRefresh}`} />}
        {activeView === 'forecast' && <PredictionsChart key={`${viewMode}-${triggerRefresh}`} viewMode={viewMode} />}

        {/* ML Metrics Cards — shown for forecast view */}
        {activeView === 'forecast' && metrics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px dashed rgba(255,255,255,0.06)',
          }}>
            {[
              { icon: Target, color: '#34d399', label: 'MAE (Forecast)', value: metrics.mae_ma, sub: `vs Naive: ${metrics.mae_naive}` },
              { icon: Activity, color: '#f43f5e', label: 'RMSE', value: metrics.rmse_ma, sub: 'Root Mean Square Error' },
              { icon: TrendingUp, color: '#00F5FF', label: 'Improvement', value: `+${metrics.improvement_pct}%`, sub: 'Over naive baseline', valueColor: '#34d399' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Icon size={14} color={m.color} />
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)' }}>
                      {m.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: m.valueColor || '#fff', fontFamily: 'var(--font-display)' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                    {m.sub}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        padding: '8px 20px 12px',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        gap: 20,
        fontFamily: 'var(--font-mono)',
      }}>
        <span style={{ color: activeView === 'revenue' ? '#fbbf24' : '#8B5CF6' }}>●</span>
        <span>{activeView === 'revenue' ? 'Revenue based on $3.50/ride avg price' : 'ML Demand predictions with moving average'}</span>
        <span style={{ marginLeft: 'auto' }}>Auto-refreshes every 30s</span>
      </div>
    </div>
  );
}
