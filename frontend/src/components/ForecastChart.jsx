import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ComposedChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { RefreshCw, TrendingUp, Target, Activity } from 'lucide-react';
import { fetchDailyPredictions, fetchWeeklyPredictions, fetchMetrics } from '../services/api';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#151a2e', border: '1px solid #2a3155', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#8892a8' },
};

function PredictionsChart({ viewMode }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (viewMode === 'daily') {
        res = await fetchDailyPredictions();
      } else {
        res = await fetchWeeklyPredictions();
      }
      
      // The backend returns: { date: [""], predictions: [0] }
      // We map this into an array of objects for Recharts
      const formattedData = res.date.map((d, i) => ({
        date: d,
        predictions: res.predictions[i]
      }));
      
      setChartData(formattedData);
    } catch (e) {
      setError('Failed to load forecast data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [viewMode, refreshKey]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 10 seconds
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setRefreshKey(k => k + 1), 10000);
    return () => clearInterval(timerRef.current);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)' }}>
      <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
      <span style={{ marginLeft: 12 }}>Loading forecast data…</span>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--rose)', flexDirection: 'column', gap: 8 }}>
      <TrendingUp size={32} />
      <span>{error}</span>
    </div>
  );

  return (
    <div className="chart-container" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" />
          <XAxis
            dataKey="date"
            stroke="#5a6478"
            fontSize={9}
            fontFamily="JetBrains Mono"
            interval={viewMode === 'daily' ? 6 : 0}
          />
          <YAxis stroke="#5a6478" fontSize={10} fontFamily="JetBrains Mono" />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#8892a8' }} />

          {/* Predictions line */}
          <Area type="monotone" dataKey="predictions" name="ML Predictions"
            stroke="#f43f5e" fill="url(#forecastGrad)" strokeWidth={2} dot={true} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Exported Component ────────────────────────────────────
export default function ForecastChart() {
  const [viewMode, setViewMode] = useState('daily');
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics().then(setMetrics).catch(err => console.error("Could not fetch metrics", err));
  }, [triggerRefresh]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Demand Forecast</div>
          <div className="card-subtitle">
            {viewMode === 'daily' ? 'Daily Machine Learning Predictions' : 'Weekly Aggregated ML Forecast'}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={viewMode}
            onChange={e => setViewMode(e.target.value)}
            style={{
              background: '#1a2040', border: '1px solid #2a3155', color: '#c8d0e0',
              borderRadius: 6, padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
            }}
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => setTriggerRefresh(k => k + 1)}
            title="Refresh forecast"
            style={{
              background: '#1a2040', border: '1px solid #2a3155', color: '#c8d0e0',
              borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <RefreshCw size={13} />
            <span style={{ fontSize: '11px' }}>Refresh</span>
          </button>
        </div>
      </div>

      <div className="card-body">
        <PredictionsChart key={`${viewMode}-${triggerRefresh}`} viewMode={viewMode} />
        
        {/* ML Metrics Cards */}
        {metrics && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
            marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #1e2440'
          }}>
            <div className="metric-card" style={{ background: '#111627', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Target size={14} color="#34d399" />
                <span style={{ fontSize: '11px', color: '#8892a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MAE (Forecast)</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{metrics.mae_ma}</div>
              <div style={{ fontSize: '10px', color: '#5a6478', marginTop: '2px' }}>vs Naive: {metrics.mae_naive}</div>
            </div>
            
            <div className="metric-card" style={{ background: '#111627', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Activity size={14} color="#f43f5e" />
                <span style={{ fontSize: '11px', color: '#8892a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RMSE</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{metrics.rmse_ma}</div>
              <div style={{ fontSize: '10px', color: '#5a6478', marginTop: '2px' }}>Root Mean Square Error</div>
            </div>

            <div className="metric-card" style={{ background: '#111627', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <TrendingUp size={14} color="#00d4ff" />
                <span style={{ fontSize: '11px', color: '#8892a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Improvement</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399' }}>+{metrics.improvement_pct}%</div>
              <div style={{ fontSize: '10px', color: '#5a6478', marginTop: '2px' }}>Over naive baseline</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '8px 20px 12px', fontSize: '11px', color: '#5a6478', borderTop: '1px solid #1e2440', display: 'flex', gap: 20 }}>
        <span><span style={{ color: '#f43f5e' }}>╌╌</span> Predicted ML demand</span>
        <span style={{ marginLeft: 'auto' }}>Auto-refreshes every 10s</span>
      </div>
    </div>
  );
}
