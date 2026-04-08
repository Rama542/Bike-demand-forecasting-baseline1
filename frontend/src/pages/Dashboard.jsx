import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { predictDemand, getRebalancing } from '../lib/api';
import { Bike, Users, TrendingUp, DollarSign, ArrowUp, ArrowDown, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import HologramCard from '../components/HologramCard';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function Dashboard() {
  const stations     = useAppStore((s) => s.stations);
  const bikes        = useAppStore((s) => s.bikes);
  const alerts       = useAppStore((s) => s.alerts);
  const predictions  = useAppStore((s) => s.predictions);
  const liveRevenue  = useAppStore((s) => s.liveRevenue);
  const datasetStats = useAppStore((s) => s.datasetStats);

  const [forecast, setForecast] = useState([]);
  const [rebalanceRecs, setRebalanceRecs] = useState([]);

  const totalBikes  = stations.reduce((a, s) => a + (s.current_bikes || 0), 0);
  const activeBikes = bikes.filter((b) => b.status === 'in-use').length;

  useEffect(() => {
    predictDemand([]).then((d) => setForecast(d.forecast || [])).catch(() => {});
    if (stations.length > 0) {
      getRebalancing(stations).then((d) => setRebalanceRecs(d.recommendations || [])).catch(() => {});
    }
  }, [stations]);

  const hourlyData = (datasetStats?.hourlyPattern || []).map((h) => ({
    hour: `${h.hour}:00`,
    demand: h.avgDemand,
    casual: h.avgCasual,
    registered: h.avgRegistered,
  }));

  const metrics = [
    { label: 'Available Bikes', value: totalBikes, icon: Bike, color: 'cyan', change: '+4', up: true },
    { label: 'Active Rides', value: activeBikes || Math.round(totalBikes * 0.35), icon: Users, color: 'emerald', change: '+12%', up: true },
    { label: 'Predicted (1hr)', value: predictions?.['1_hour'] || forecast[0] || '—', icon: TrendingUp, color: 'violet', change: '+8%', up: true },
    { label: 'Revenue Today', value: `$${Math.round(liveRevenue?.daily || 2450)}`, icon: DollarSign, color: 'amber', change: '+5.2%', up: true },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 280, damping: 24 } }
  };

  return (
    <motion.div
      className="page-container"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ paddingBottom: 16, borderBottom: '1px solid rgba(0,245,255,0.06)' }}>
        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          background: 'linear-gradient(135deg, #00F5FF 0%, #8B5CF6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}>
          NEXUS CONTROL
        </h1>
        <p style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'rgba(0,245,255,0.4)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          Live Fleet Matrix // {new Date().toLocaleDateString()}
        </p>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={itemVariants} className="metrics-grid">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <HologramCard
              key={m.label}
              glowColor={m.color === 'cyan' ? '#00F5FF' : m.color === 'violet' ? '#8B5CF6' : m.color === 'emerald' ? '#34d399' : '#fbbf24'}
            >
              <div className={`metric-card ${m.color}`} style={{ border: 'none', borderRadius: 14, background: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className={`metric-icon ${m.color}`}><Icon size={18} /></div>
                  <div className={`metric-change ${m.up ? 'up' : 'down'}`}>
                    {m.up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                    {m.change}
                  </div>
                </div>
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">{m.value}</div>
              </div>
            </HologramCard>
          );
        })}
      </motion.div>

      {/* Main Grid: Chart + Map */}
      <motion.div variants={itemVariants} className="dashboard-grid grid-8-4">
        {/* Demand Chart */}
        <HologramCard style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,245,255,0.06)' }}>
            <div>
              <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.06em' }}>
                TEMPORAL DEMAND PULSE
              </div>
              <div className="card-subtitle">Macro Hourly Activity Index</div>
            </div>
            <span className="badge violet">ML Core Active</span>
          </div>
          <div className="card-body">
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData.length > 0 ? hourlyData : generateMockHourlyData()}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00F5FF" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,245,255,0.06)" vertical={false} />
                  <XAxis dataKey="hour" stroke="rgba(255,255,255,0.25)" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(8,12,24,0.95)',
                      border: '1px solid rgba(0,245,255,0.25)',
                      borderRadius: 10,
                      fontSize: '0.78rem',
                      boxShadow: '0 0 24px rgba(0,245,255,0.15)',
                      backdropFilter: 'blur(20px)',
                    }}
                    labelStyle={{ color: '#00F5FF', fontWeight: 700, fontFamily: 'JetBrains Mono' }}
                    itemStyle={{ color: '#d8f8ff' }}
                  />
                  <Area type="monotone" dataKey="registered" stroke="#00F5FF" strokeWidth={2.5} fillOpacity={1} fill="url(#cyanGrad)"
                    activeDot={{ r: 5, fill: '#00F5FF', stroke: '#fff', strokeWidth: 2 }} animationDuration={1800} />
                  <Area type="monotone" dataKey="casual" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#violetGrad)"
                    activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </HologramCard>

        {/* 3D Map */}
        <HologramCard style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 10 }}>
            <div style={{
              background: 'rgba(8,12,24,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,245,255,0.15)',
              borderRadius: 10,
              padding: '8px 14px',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: '#fff', letterSpacing: '0.1em' }}>HOLOGRAPHIC HUB</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--cyan)', marginTop: 2 }}>{stations.length} Active Nodes</div>
            </div>
          </div>
          <div style={{ height: 360, width: '100%', background: 'transparent' }}>
            {stations.length > 0 && (
              <MapContainer
                center={[12.9716, 77.5946]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {stations.map((st) => {
                  const ratio = st.current_bikes / (st.capacity || 1);
                  const color = ratio < 0.2 ? '#f43f5e' : ratio > 0.8 ? '#fbbf24' : ratio > 0.5 ? '#34d399' : '#00F5FF';
                  return (
                    <CircleMarker
                      key={`dash-st-${st.id}`}
                      center={[st.lat, st.lng]}
                      radius={6}
                      pathOptions={{
                        fillColor: color,
                        color: color,
                        fillOpacity: 0.2,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div style={{ color: '#00F5FF', fontSize: 12, fontWeight: 700 }}>
                          {st.name}
                        </div>
                        <div style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>
                          Bikes: {st.current_bikes} / {st.capacity}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </HologramCard>
      </motion.div>

      {/* Bottom Grid: Rebalancing + Alerts */}
      <motion.div variants={itemVariants} className="dashboard-grid grid-7-5">
        {/* Rebalancing */}
        <HologramCard>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,245,255,0.06)' }}>
            <div>
              <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>
                AI REBALANCING
              </div>
              <div className="card-subtitle">Fleet movement recommendations</div>
            </div>
            <span className="badge emerald">{rebalanceRecs.length} actions</span>
          </div>
          <div className="card-body">
            {rebalanceRecs.length > 0 ? (
              <div className="rebalance-list">
                <AnimatePresence>
                  {rebalanceRecs.map((rec, i) => (
                    <motion.div
                      key={i}
                      className="rebalance-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <div className="rebalance-amount">{rec.amount}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rec.action}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                          Priority: {rec.priority || 'medium'}
                        </div>
                      </div>
                      <span className={`badge ${rec.priority === 'high' ? 'rose' : 'amber'}`}>
                        {rec.priority || 'medium'}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="empty-state">
                <MapPin size={22} style={{ color: 'var(--cyan)', opacity: 0.5 }} />
                <p style={{ fontSize: '0.82rem' }}>All stations are well-balanced</p>
              </div>
            )}
          </div>
        </HologramCard>

        {/* Alerts */}
        <HologramCard glowColor="#f43f5e">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(244,63,94,0.08)' }}>
            <div>
              <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>
                SYSTEM ALERTS
              </div>
              <div className="card-subtitle">Real-time notifications</div>
            </div>
            <span className="badge rose">{alerts.filter((a) => !a.read).length} new</span>
          </div>
          <div className="card-body">
            <div className="alerts-list">
              <AnimatePresence>
                {alerts.slice(0, 8).map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    className={`alert-item ${alert.type}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div style={{ flex: 1, fontSize: '0.8rem' }}>{alert.message}</div>
                    <div className="alert-time">{alert.time}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </HologramCard>
      </motion.div>
    </motion.div>
  );
}

function generateMockHourlyData() {
  return Array.from({ length: 24 }, (_, i) => {
    const peak = Math.sin((i - 8) * Math.PI / 12) * 150 + 200;
    return {
      hour: `${i}:00`,
      demand: Math.max(20, Math.round(peak)),
      casual: Math.max(5, Math.round(peak * 0.3)),
      registered: Math.max(15, Math.round(peak * 0.7)),
    };
  });
}
