import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Bike, MapPin, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HologramCard from '../components/HologramCard';

export default function Fleet() {
  const stations = useAppStore((s) => s.stations);
  const bikes    = useAppStore((s) => s.bikes);
  const [filter, setFilter] = useState('all');

  const filteredBikes = bikes.filter((b) => filter === 'all' || b.status === filter);

  const statusCounts = {
    idle:        bikes.filter((b) => b.status === 'idle').length,
    'in-use':    bikes.filter((b) => b.status === 'in-use').length,
    maintenance: bikes.filter((b) => b.status === 'maintenance').length,
  };

  const statusColor = {
    idle: 'var(--emerald)',
    'in-use': 'var(--cyan)',
    maintenance: 'var(--amber)',
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
  };

  return (
    <motion.div
      className="animate-in"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.06em', background: 'linear-gradient(135deg, #00F5FF, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          FLEET MANAGEMENT
        </h1>
        <p>Live bike tracking & station overview</p>
      </div>

      {/* Status Summary */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 18 }}>
        {[
          { key: 'idle',        label: 'Idle Bikes',   icon: Bike,    color: 'emerald' },
          { key: 'in-use',     label: 'In Use',        icon: MapPin,  color: 'cyan' },
          { key: 'maintenance', label: 'Maintenance',  icon: Wrench,  color: 'amber' },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = filter === s.key;
          return (
            <HologramCard
              key={s.key}
              onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
              style={{ cursor: 'pointer', outline: isActive ? `2px solid var(--${s.color})` : 'none', outlineOffset: 2 }}
              glowColor={s.color === 'cyan' ? '#00F5FF' : s.color === 'emerald' ? '#34d399' : '#fbbf24'}
            >
              <div className={`metric-card ${s.color}`} style={{ border: 'none', background: 'transparent', borderRadius: 14 }}>
                <div className={`metric-icon ${s.color}`}><Icon size={18} /></div>
                <div className="metric-label">{s.label}</div>
                <div className="metric-value">{statusCounts[s.key]}</div>
              </div>
            </HologramCard>
          );
        })}
      </div>

      <div className="dashboard-grid grid-7-5">
        {/* Map */}
        <HologramCard style={{ overflow: 'hidden', padding: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,245,255,0.06)', padding: '14px 18px' }}>
            <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', letterSpacing: '0.08em' }}>LIVE FLEET MAP</div>
            <span className="badge cyan">{filteredBikes.length} bikes</span>
          </div>
          <div style={{ height: 440 }}>
            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />
              {stations.map((st) => (
                <CircleMarker
                  key={`st-${st.id}`}
                  center={[st.lat, st.lng]}
                  radius={14}
                  pathOptions={{
                    fillColor: '#00F5FF',
                    color: '#00F5FF',
                    fillOpacity: 0.12,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ color: '#000', fontSize: 12 }}>
                      <strong>{st.name}</strong><br />
                      Bikes: {st.current_bikes}/{st.capacity}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {filteredBikes.filter((b) => b.lat && b.lng).map((bike) => (
                <CircleMarker
                  key={`bike-${bike.id}`}
                  center={[bike.lat, bike.lng]}
                  radius={5}
                  pathOptions={{
                    fillColor: statusColor[bike.status] || '#fff',
                    color: statusColor[bike.status],
                    fillOpacity: 0.9,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div style={{ color: '#000', fontSize: 11 }}>
                      Bike #{bike.id}<br />
                      Status: {bike.status}<br />
                      Battery: {bike.battery_level}%
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </HologramCard>

        {/* Station Cards */}
        <HologramCard style={{ overflow: 'hidden', maxHeight: 520, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,245,255,0.06)', padding: '14px 18px' }}>
            <div className="card-title" style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', letterSpacing: '0.08em' }}>STATION STATUS</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              initial="hidden"
              animate="show"
            >
              {stations.map((st) => {
                const ratio = st.current_bikes / (st.capacity || 1);
                const barColor = ratio < 0.2 ? 'rose' : ratio > 0.8 ? 'amber' : ratio > 0.5 ? 'emerald' : 'cyan';
                return (
                  <motion.div
                    key={st.id}
                    className="station-card"
                    variants={cardVariants}
                    whileHover={{ x: 3 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div className="station-name" style={{ fontSize: '0.85rem' }}>{st.name}</div>
                      <span className={`badge ${barColor}`}>{Math.round(ratio * 100)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                      <span>{st.current_bikes} / {st.capacity} bikes</span>
                      <span>ID: {st.id}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className={`progress-fill ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${ratio * 100}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </HologramCard>
      </div>
    </motion.div>
  );
}
