import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Clock, TrendingUp, Users, Zap, Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';

// ── UCI Bike-Sharing hourly averages (real data, season=summer/warm, workday)
// avgCnt per hour extracted from hour.csv aggregate
const HOURLY_AVG_WORKDAY = [
  47, 34, 24, 14, 5, 23, 87, 283, 463, 263, 178, 221,
  285, 270, 255, 249, 298, 451, 397, 283, 205, 171, 126, 80,
];
const HOURLY_AVG_WEEKEND = [
  83, 65, 41, 28, 15, 12, 26, 57, 115, 195, 263, 318,
  341, 339, 308, 307, 307, 293, 230, 189, 163, 123, 101, 93,
];

// Season multipliers  (1=Spring 2=Summer 3=Fall 4=Winter)
const SEASON_MULT = { 1: 0.85, 2: 1.22, 3: 1.10, 4: 0.72 };
const SEASON_LABELS = { 1: 'Spring', 2: 'Summer', 3: 'Fall', 4: 'Winter' };
const SEASON_COLORS = { 1: '#34d399', 2: '#fbbf24', 3: '#f97316', 4: '#60a5fa' };

// Weather multipliers (1=Clear 2=Cloudy 3=Light Rain 4=Heavy Rain)
const WEATHER_MULT = { 1: 1.15, 2: 1.00, 3: 0.72, 4: 0.38 };
const WEATHER_LABELS = { 1: 'Clear ☀️', 2: 'Cloudy ☁️', 3: 'Light Rain 🌧️', 4: 'Heavy Rain ⛈️' };
const WEATHER_ICONS = { 1: Sun, 2: Cloud, 3: CloudRain, 4: CloudRain };

// Demand level thresholds
function demandLevel(val) {
  if (val >= 400) return { label: 'VERY HIGH', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' };
  if (val >= 250) return { label: 'HIGH', color: '#f97316', bg: 'rgba(249,115,22,0.12)' };
  if (val >= 150) return { label: 'MODERATE', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  if (val >= 80)  return { label: 'LOW', color: '#34d399', bg: 'rgba(52,211,153,0.12)' };
  return { label: 'VERY LOW', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' };
}

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export default function HourlyDemandForecaster() {
  const [selectedHour, setSelectedHour] = useState(15); // default 3 PM
  const [dayType, setDayType] = useState('workday');    // 'workday' | 'weekend'
  const [season, setSeason] = useState(2);              // 1-4
  const [weather, setWeather] = useState(1);            // 1-4

  // Forecast for ALL 24 hours (for bar chart)
  const allHours = useMemo(() => {
    const base = dayType === 'workday' ? HOURLY_AVG_WORKDAY : HOURLY_AVG_WEEKEND;
    const sm = SEASON_MULT[season];
    const wm = WEATHER_MULT[weather];
    return base.map((cnt, hr) => {
      const predicted = Math.round(cnt * sm * wm);
      const lv = demandLevel(predicted);
      return { hour: hr, label: formatHour(hr), predicted, level: lv.label, color: lv.color };
    });
  }, [dayType, season, weather]);

  // Selected hour result
  const selected = allHours[selectedHour];
  const level = demandLevel(selected.predicted);

  // ±1hr comparison
  const prevHr = allHours[(selectedHour + 23) % 24];
  const nextHr = allHours[(selectedHour + 1) % 24];
  const delta = selected.predicted - (dayType === 'workday' ? HOURLY_AVG_WORKDAY[selectedHour] : HOURLY_AVG_WEEKEND[selectedHour]);

  const peakHour = allHours.reduce((a, b) => b.predicted > a.predicted ? b : a);
  const quietHour = allHours.reduce((a, b) => b.predicted < a.predicted ? b : a);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Controls Row ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

        {/* Day Type */}
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Day Type
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
            {[['workday', '💼 Workday'], ['weekend', '🏖️ Weekend']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setDayType(v)}
                style={{
                  flex: 1, padding: '8px 4px', fontSize: 11,
                  fontFamily: 'var(--font-mono)', cursor: 'pointer', border: 'none',
                  background: dayType === v ? 'rgba(0,245,255,0.15)' : 'transparent',
                  color: dayType === v ? '#00F5FF' : 'rgba(255,255,255,0.4)',
                  borderRight: v === 'workday' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  transition: 'all 0.2s',
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Season */}
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Season
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
            {[1, 2, 3, 4].map((s, i) => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                style={{
                  flex: 1, padding: '8px 2px', fontSize: 10,
                  fontFamily: 'var(--font-mono)', cursor: 'pointer', border: 'none',
                  background: season === s ? `${SEASON_COLORS[s]}28` : 'transparent',
                  color: season === s ? SEASON_COLORS[s] : 'rgba(255,255,255,0.35)',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  transition: 'all 0.2s',
                }}
              >{SEASON_LABELS[s]}</button>
            ))}
          </div>
        </div>

        {/* Weather */}
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Weather
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
            {[1, 2, 3, 4].map((w, i) => {
              const icons = ['☀️', '☁️', '🌧️', '⛈️'];
              return (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  style={{
                    flex: 1, padding: '8px 2px', fontSize: 14,
                    cursor: 'pointer', border: 'none',
                    background: weather === w ? 'rgba(0,245,255,0.1)' : 'transparent',
                    opacity: weather === w ? 1 : 0.45,
                    borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    transition: 'all 0.2s',
                    filter: weather === w ? 'drop-shadow(0 0 6px #00F5FF)' : 'none',
                  }}
                >{icons[i]}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Time Slider ──────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Select Time
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} color="#00F5FF" />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#00F5FF', fontFamily: 'var(--font-display)' }}>
              {formatHour(selectedHour)}
            </span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={23}
          value={selectedHour}
          onChange={(e) => setSelectedHour(Number(e.target.value))}
          style={{
            width: '100%',
            height: 6,
            appearance: 'none',
            background: `linear-gradient(to right, #00F5FF ${(selectedHour / 23) * 100}%, rgba(255,255,255,0.08) ${(selectedHour / 23) * 100}%)`,
            borderRadius: 999,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
          <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
        </div>
      </div>

      {/* ── Main Result Card ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedHour}-${dayType}-${season}-${weather}`}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            background: level.bg,
            border: `1px solid ${level.color}44`,
            borderRadius: 16,
            padding: '20px 24px',
            boxShadow: `0 0 40px ${level.color}20`,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 20,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              🔮 Predicted Demand at {formatHour(selectedHour)}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: level.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {selected.predicted.toLocaleString()}
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>rides/hr</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: `${level.color}20`, border: `1px solid ${level.color}55`,
                color: level.color, borderRadius: 6, padding: '3px 10px',
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em',
              }}>
                {level.label}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {WEATHER_LABELS[weather]} · {SEASON_LABELS[season]} · {dayType === 'workday' ? '💼 Workday' : '🏖️ Weekend'}
              </span>
            </div>
          </div>

          {/* Adjacent hours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 130 }}>
            {[
              { label: `← ${formatHour((selectedHour + 23) % 24)}`, val: prevHr.predicted, dimmed: true },
              { label: `→ ${formatHour((selectedHour + 1) % 24)}`, val: nextHr.predicted, dimmed: true },
            ].map(({ label, val, dimmed }) => {
              const lv = demandLevel(val);
              return (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '8px 12px',
                }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: lv.color, fontFamily: 'var(--font-display)' }}>{val}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── 24-hour Bar Chart ─────────────────────────────── */}
      <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Full Day Demand Curve
        </div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allHours} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.15)"
                fontSize={8}
                fontFamily="JetBrains Mono"
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis stroke="rgba(255,255,255,0.1)" fontSize={8} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(8,12,24,0.97)',
                  border: '1px solid rgba(0,245,255,0.2)',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 0 20px rgba(0,245,255,0.1)',
                  backdropFilter: 'blur(20px)',
                }}
                labelStyle={{ color: '#00F5FF', fontFamily: 'JetBrains Mono', fontWeight: 700 }}
                formatter={(val) => [`${val} rides/hr`, 'Forecast']}
              />
              <ReferenceLine x={formatHour(selectedHour)} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 3" />
              <Bar dataKey="predicted" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {allHours.map((entry) => (
                  <Cell
                    key={entry.hour}
                    fill={entry.hour === selectedHour ? entry.color : `${entry.color}55`}
                    stroke={entry.hour === selectedHour ? entry.color : 'none'}
                    strokeWidth={entry.hour === selectedHour ? 1.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Insight Pills ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          {
            icon: Zap,
            label: 'Peak Hour',
            value: peakHour.label,
            sub: `${peakHour.predicted} rides/hr`,
            color: '#f43f5e',
          },
          {
            icon: TrendingUp,
            label: 'Selected vs Avg',
            value: `${delta >= 0 ? '+' : ''}${delta}`,
            sub: delta >= 0 ? 'Above baseline' : 'Below baseline',
            color: delta >= 0 ? '#34d399' : '#f43f5e',
          },
          {
            icon: Users,
            label: 'Quiet Hour',
            value: quietHour.label,
            sub: `${quietHour.predicted} rides/hr`,
            color: '#60a5fa',
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon size={13} color={color} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ color: '#8B5CF6' }}>●</span>
        Predictions based on UCI Bike-Sharing Dataset (17,379 hourly records) · Season × Weather × Day-type model
      </div>
    </div>
  );
}
