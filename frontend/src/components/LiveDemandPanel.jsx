import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';

const BANGALORE_LAT = 12.9716;
const BANGALORE_LNG = 77.5946;

// UCI Bike-Sharing real hourly averages (from hour.csv aggregate)
const HOURLY_AVG_WORKDAY = [
  47, 34, 24, 14, 5, 23, 87, 283, 463, 263, 178, 221,
  285, 270, 255, 249, 298, 451, 397, 283, 205, 171, 126, 80,
];
const HOURLY_AVG_WEEKEND = [
  83, 65, 41, 28, 15, 12, 26, 57, 115, 195, 263, 318,
  341, 339, 308, 307, 307, 293, 230, 189, 163, 123, 101, 93,
];

// OpenMeteo weather code → UCI weathersit + demand multiplier
function mapWeatherCode(code) {
  if (code === 0 || code === 1)              return { label: 'Clear Sky',     icon: '☀️', mult: 1.15, color: '#fbbf24' };
  if (code === 2)                            return { label: 'Partly Cloudy', icon: '⛅', mult: 1.05, color: '#94a3b8' };
  if (code === 3)                            return { label: 'Overcast',      icon: '☁️', mult: 0.95, color: '#64748b' };
  if (code >= 45 && code <= 48)             return { label: 'Foggy',         icon: '🌫️', mult: 0.80, color: '#94a3b8' };
  if (code >= 51 && code <= 55)             return { label: 'Drizzle',       icon: '🌦️', mult: 0.72, color: '#60a5fa' };
  if (code >= 61 && code <= 67)             return { label: 'Rain',          icon: '🌧️', mult: 0.65, color: '#3b82f6' };
  if (code >= 71 && code <= 77)             return { label: 'Snow',          icon: '❄️', mult: 0.38, color: '#a5f3fc' };
  if (code >= 80 && code <= 82)             return { label: 'Rain Showers',  icon: '🌧️', mult: 0.68, color: '#60a5fa' };
  if (code >= 95)                            return { label: 'Thunderstorm',  icon: '⛈️', mult: 0.38, color: '#8B5CF6' };
  return { label: 'Clear', icon: '☀️', mult: 1.0, color: '#fbbf24' };
}

// Bangalore seasonal multipliers (not Washington DC seasons)
function getSeasonMult(month) {
  if (month >= 9 && month <= 10) return 1.05;  // Oct-Nov: post-monsoon, pleasant
  if (month >= 11 || month <= 1) return 0.80;  // Dec-Feb: cool/mild
  if (month >= 2 && month <= 4)  return 0.90;  // Mar-May: hot
  return 0.70;                                   // Jun-Sep: monsoon
}

function getTempMult(temp) {
  if (temp < 15) return 0.70;
  if (temp < 22) return 0.90;
  if (temp < 30) return 1.10;
  if (temp < 36) return 0.95;
  return 0.80;
}

function getDemandLevel(val) {
  if (val >= 420) return { label: 'VERY HIGH', color: '#f43f5e', bg: 'rgba(244,63,94,0.10)' };
  if (val >= 280) return { label: 'HIGH',      color: '#f97316', bg: 'rgba(249,115,22,0.10)' };
  if (val >= 160) return { label: 'MODERATE',  color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' };
  if (val >= 80)  return { label: 'LOW',       color: '#34d399', bg: 'rgba(52,211,153,0.10)' };
  return           { label: 'VERY LOW',  color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' };
}

function formatHour(h) {
  if (h === 0)  return '12 AM';
  if (h < 12)   return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function LiveDemandPanel() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastFetch, setLastFetch]     = useState(null);
  const [now, setNow]                 = useState(new Date());

  // Clock tick every 30s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Fetch real Bangalore weather from OpenMeteo (free, no API key)
  const fetchWeather = async () => {
    try {
      setLoading(true);
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${BANGALORE_LAT}&longitude=${BANGALORE_LNG}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
        `&hourly=temperature_2m,weather_code` +
        `&timezone=Asia%2FKolkata&forecast_days=1`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWeatherData(data);
      setLastFetch(new Date());
      setError(null);
    } catch (e) {
      setError('Live weather unavailable — using UCI patterns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const t = setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(t);
  }, []);

  // Compute predictions from real weather + current time + UCI patterns
  const { current, nextHours, peakAhead, isWeekend, liveWeather, weatherMult } = useMemo(() => {
    const hour      = now.getHours();
    const dayOfWeek = now.getDay();
    const month     = now.getMonth();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseArr   = isWeekend ? HOURLY_AVG_WEEKEND : HOURLY_AVG_WORKDAY;
    const seasonM   = getSeasonMult(month);

    let liveWeather  = null;
    let weatherMultiplier = 1.0;

    if (weatherData?.current) {
      const wc   = mapWeatherCode(weatherData.current.weather_code);
      const tempM = getTempMult(weatherData.current.temperature_2m);
      weatherMultiplier = wc.mult * tempM;
      liveWeather = {
        ...wc,
        temp:       Math.round(weatherData.current.temperature_2m),
        feelsLike:  Math.round(weatherData.current.apparent_temperature),
        humidity:   Math.round(weatherData.current.relative_humidity_2m),
        wind:       Math.round(weatherData.current.wind_speed_10m),
      };
    }

    const predict = (h) => {
      const base = baseArr[h % 24];
      return Math.max(5, Math.round(base * seasonM * weatherMultiplier));
    };

    const currentVal = predict(hour);
    const currentLvl = getDemandLevel(currentVal);

    const nextHours = Array.from({ length: 5 }, (_, i) => {
      const h = (hour + i + 1) % 24;
      const val = predict(h);
      return { hour: h, label: `+${i + 1}h`, hourLabel: formatHour(h), predicted: val, ...getDemandLevel(val) };
    });

    // Find peak hour remaining today
    const remaining = [];
    for (let h = hour; h < 24; h++) {
      remaining.push({ hour: h, predicted: predict(h) });
    }
    const peakAhead = remaining.reduce((a, b) => b.predicted > a.predicted ? b : a, remaining[0]);

    return {
      current:     { hour, predicted: currentVal, ...currentLvl },
      nextHours,
      peakAhead,
      isWeekend,
      liveWeather,
      weatherMult: weatherMultiplier,
    };
  }, [weatherData, now]);

  const prevHourPredicted = useMemo(() => {
    const hour = now.getHours();
    const month = now.getMonth();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseArr = isWeekend ? HOURLY_AVG_WEEKEND : HOURLY_AVG_WORKDAY;
    const seasonM = getSeasonMult(month);
    const prevH = (hour + 23) % 24;
    const base = baseArr[prevH];
    return Math.max(5, Math.round(base * seasonM * weatherMult));
  }, [now, weatherMult]);

  const delta = current.predicted - prevHourPredicted;
  const deltaUp = delta >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Live Weather Row ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {loading && !liveWeather ? (
          <div style={{ gridColumn: '1/-1', ...pillStyle }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            <span style={{ fontSize: 11, color: 'rgba(0,245,255,0.5)', fontFamily: 'var(--font-mono)' }}>
              Fetching live Bangalore weather…
            </span>
          </div>
        ) : liveWeather ? (
          <>
            <div style={pillStyle}>
              <span style={{ fontSize: 30 }}>{liveWeather.icon}</span>
              <div>
                <div style={pillLabel}>Condition</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2, lineHeight: 1.2 }}>
                  {liveWeather.label}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  Bangalore, IND
                </div>
              </div>
            </div>

            <div style={pillStyle}>
              <Thermometer size={20} color="#fbbf24" />
              <div>
                <div style={pillLabel}>Temperature</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {liveWeather.temp}°C
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                  Feels {liveWeather.feelsLike}°C
                </div>
              </div>
            </div>

            <div style={pillStyle}>
              <Droplets size={20} color="#00F5FF" />
              <div>
                <div style={pillLabel}>Humidity</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#00F5FF', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {liveWeather.humidity}%
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                  Relative humidity
                </div>
              </div>
            </div>

            <div style={pillStyle}>
              <Wind size={20} color="#8B5CF6" />
              <div>
                <div style={pillLabel}>Wind Speed</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#8B5CF6', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {liveWeather.wind}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                  km/h
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ gridColumn: '1/-1', ...pillStyle }}>
            <span style={{ fontSize: 11, color: 'rgba(255,200,0,0.6)', fontFamily: 'var(--font-mono)' }}>
              ⚠ {error}
            </span>
          </div>
        )}
      </div>

      {/* ── Current Hour Big Card ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.hour}-${current.predicted}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: current.bg,
            border: `1px solid ${current.color}44`,
            borderRadius: 20,
            padding: '22px 26px',
            boxShadow: `0 0 60px ${current.color}16`,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {/* Radial glow */}
          <div style={{
            position: 'absolute', right: -40, top: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: `${current.color}0d`, filter: 'blur(50px)',
            pointerEvents: 'none',
          }} />

          <div>
            {/* Header badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                Live Prediction · Bangalore · {isWeekend ? 'Weekend' : 'Weekday'}
              </span>
              <span style={{
                background: 'rgba(0,245,255,0.12)', border: '1px solid rgba(0,245,255,0.35)',
                borderRadius: 20, padding: '2px 9px',
                fontSize: 9, fontFamily: 'var(--font-mono)', color: '#00F5FF', letterSpacing: '0.1em',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%', background: '#00F5FF',
                  boxShadow: '0 0 6px #00F5FF',
                  animation: 'pulse 2s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                LIVE
              </span>
              {liveWeather && (
                <span style={{
                  background: `${liveWeather.color}18`, border: `1px solid ${liveWeather.color}44`,
                  borderRadius: 20, padding: '2px 9px',
                  fontSize: 9, fontFamily: 'var(--font-mono)', color: liveWeather.color, letterSpacing: '0.08em',
                }}>
                  {liveWeather.icon} {liveWeather.label}
                </span>
              )}
            </div>

            {/* Demand number */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 10 }}>
              <span style={{
                fontSize: 68, fontWeight: 900, color: current.color,
                fontFamily: 'var(--font-display)', lineHeight: 1,
                textShadow: `0 0 40px ${current.color}60`,
              }}>
                {current.predicted.toLocaleString()}
              </span>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>rides/hr</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>est. demand</div>
              </div>
            </div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                ...badge,
                background: `${current.color}1a`, border: `1px solid ${current.color}55`, color: current.color,
              }}>
                {current.label} DEMAND
              </span>

              <span style={{
                ...badge,
                background: deltaUp ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)',
                border: `1px solid ${deltaUp ? '#34d39944' : '#f43f5e44'}`,
                color: deltaUp ? '#34d399' : '#f43f5e',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {deltaUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {deltaUp ? '+' : ''}{delta} vs prev hr
              </span>

              {peakAhead && peakAhead.hour !== current.hour && (
                <span style={{
                  ...badge,
                  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Zap size={10} />
                  Peak at {formatHour(peakAhead.hour)} → {peakAhead.predicted}
                </span>
              )}
            </div>
          </div>

          {/* Right: Live clock + demand ring */}
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <div style={{
              fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,0.92)',
              fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.02em',
            }}>
              {formatTime(now)}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
              {formatHour(current.hour)}
            </div>
            {liveWeather && (
              <div style={{ fontSize: 26, marginTop: 10 }}>{liveWeather.icon}</div>
            )}
            {weatherMult !== 1 && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
                weather adj. {(weatherMult * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Next 5 Hours Forecast ─────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
          Next 5 Hours
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {nextHours.map((f, idx) => {
            const barPct = Math.min(100, Math.round((f.predicted / 500) * 100));
            return (
              <motion.div
                key={f.hour}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, type: 'spring', stiffness: 260, damping: 24 }}
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: `1px solid ${f.color}2a`,
                  borderRadius: 14,
                  padding: '12px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                  {f.hourLabel}
                </div>
                {/* Bar */}
                <div style={{ height: 54, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 8 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barPct}%` }}
                    transition={{ delay: idx * 0.07 + 0.25, duration: 0.7, ease: 'easeOut' }}
                    style={{
                      width: '55%', minHeight: 4, borderRadius: '4px 4px 0 0',
                      background: `linear-gradient(to top, ${f.color}, ${f.color}55)`,
                    }}
                  />
                </div>
                <div style={{ fontSize: 19, fontWeight: 900, color: f.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {f.predicted}
                </div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>rides</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#00F5FF' }}>●</span>
          Live weather: OpenMeteo · Bangalore ({BANGALORE_LAT}°N, {BANGALORE_LNG}°E)
          {lastFetch && (
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>
              · Updated {lastFetch.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-mono)' }}>
            Model: UCI 17,379 records × Weather × Season
          </span>
          <button
            onClick={fetchWeather}
            disabled={loading}
            style={{
              background: 'none', border: '1px solid rgba(0,245,255,0.15)',
              color: 'rgba(0,245,255,0.4)', borderRadius: 6,
              padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontFamily: 'var(--font-mono)',
            }}
          >
            <RefreshCw size={9} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

const pillStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: '14px 16px',
};

const pillLabel = {
  fontSize: 9,
  color: 'rgba(255,255,255,0.3)',
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 4,
};

const badge = {
  borderRadius: 20,
  padding: '3px 10px',
  fontSize: 9,
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  letterSpacing: '0.08em',
};
