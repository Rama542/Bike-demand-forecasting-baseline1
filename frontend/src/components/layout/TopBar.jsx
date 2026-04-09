import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import { UserButton } from '@clerk/react';
import { Bell, Sun, Cloud, CloudRain, Zap } from 'lucide-react';

const weatherIcons = { clear: Sun, cloudy: Cloud, rain: CloudRain };

function HUDClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="hud-clock">{time}</span>;
}

export default function TopBar() {
  const alerts  = useAppStore((s) => s.alerts);
  const weather = useAppStore((s) => s.weather);
  const user    = useAppStore((s) => s.user);
  const [showNotif, setShowNotif] = useState(false);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const WeatherIcon = weatherIcons[weather?.type] || Sun;

  return (
    <div className="topbar">
      {/* Left */}
      <div className="topbar-left">
        {/* Live badge */}
        <motion.div
          className="badge live-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="live-dot" />
          LIVE
        </motion.div>

        {/* Weather pill */}
        <div className="hud-pill">
          <WeatherIcon size={14} style={{ color: 'var(--amber)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            {weather?.temp || 22}°C
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
            {weather?.label || 'Clear'}
          </span>
        </div>

        {/* Clock */}
        <div className="hud-pill">
          <Zap size={11} style={{ color: 'var(--cyan)' }} />
          <HUDClock />
        </div>
      </div>

      {/* Right */}
      <div className="topbar-right">
        {/* Notification Bell */}
        <div className="relative">
          <motion.button
            className="btn-icon"
            title="Notifications"
            onClick={() => setShowNotif(!showNotif)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={17} />
          </motion.button>

          {unreadCount > 0 && (
            <motion.span
              className="notif-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}

          {/* Mini notification dropdown */}
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: 300,
                  background: 'rgba(8,12,24,0.96)',
                  border: '1px solid rgba(0,245,255,0.15)',
                  borderRadius: 12,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(20px)',
                  overflow: 'hidden',
                  zIndex: 200,
                }}
                onMouseLeave={() => setShowNotif(false)}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,245,255,0.07)', fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--cyan)', letterSpacing: '0.1em' }}>
                  SYSTEM ALERTS
                </div>
                {alerts.slice(0, 5).map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{
                        color: alert.type === 'critical' ? 'var(--rose)' : alert.type === 'warning' ? 'var(--amber)' : 'var(--cyan)',
                        fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700
                      }}>
                        {alert.type?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{alert.time}</span>
                    </div>
                    {alert.message}
                  </motion.div>
                ))}
                {alerts.length === 0 && (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    No alerts
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div style={{ marginLeft: 8 }}>
          <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 34, height: 34 } } }} />
        </div>
      </div>
    </div>
  );
}
