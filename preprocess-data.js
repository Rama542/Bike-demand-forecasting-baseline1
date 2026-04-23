/**
 * preprocess-data.js  — Run ONCE at build time
 * ================================================
 * Reads backend/day.csv and backend/hour.csv (real UCI dataset)
 * Computes the same analytics the Python FastAPI did, but outputs
 * static JSON files into frontend/public/data/ so Vercel can serve them.
 *
 * Usage:  node preprocess-data.js
 */

const fs   = require('fs');
const path = require('path');

// ── Paths ──────────────────────────────────────────────────────
const ROOT    = __dirname;
const DAY_CSV  = path.join(ROOT, 'backend', 'day.csv');
const HOUR_CSV = path.join(ROOT, 'backend', 'hour.csv');
const OUT_DIR  = path.join(ROOT, 'frontend', 'public', 'data');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── CSV parser ─────────────────────────────────────────────────
function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace('\r',''));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i]?.trim().replace('\r',''); });
    return row;
  });
}

console.log('📊 Loading CSVs...');
const dayData  = parseCsv(DAY_CSV);
const hourData = parseCsv(HOUR_CSV);
console.log(`  day.csv  → ${dayData.length} records`);
console.log(`  hour.csv → ${hourData.length} records`);

// ── 1. Daily Predictions (7-day moving average, last 60 records) ──
function computeDailyPredictions() {
  const WINDOW = 7;
  // Enrich with SMA-7
  const rows = dayData.map(r => ({ ...r, cnt: parseInt(r.cnt, 10) }));
  for (let i = 0; i < rows.length; i++) {
    if (i < WINDOW - 1) { rows[i].sma7 = null; continue; }
    const slice = rows.slice(i - WINDOW + 1, i + 1);
    rows[i].sma7 = Math.round(slice.reduce((s, r) => s + r.cnt, 0) / WINDOW);
  }
  // Last 60 rows with valid SMA
  const valid = rows.filter(r => r.sma7 !== null).slice(-60);
  return {
    date: valid.map(r => r.dteday),
    predictions: valid.map(r => r.sma7),
  };
}

// ── 2. Weekly predictions (aggregate by week) ─────────────────
function computeWeeklyPredictions() {
  const rows = dayData.map(r => ({
    date: new Date(r.dteday),
    cnt: parseInt(r.cnt, 10),
  }));
  // Group by ISO week
  const weekMap = {};
  rows.forEach(r => {
    const d = r.date;
    // Get Monday of this week
    const dayOfWeek = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    const key = monday.toISOString().slice(0, 10);
    if (!weekMap[key]) weekMap[key] = [];
    weekMap[key].push(r.cnt);
  });
  const weeks = Object.keys(weekMap).sort().slice(-20);
  return {
    date: weeks.map(w => `Week of ${w.slice(5)}`),
    predictions: weeks.map(w => Math.round(weekMap[w].reduce((a, b) => a + b, 0))),
  };
}

// ── 3. Metrics (MAE, RMSE vs naive baseline) ──────────────────
function computeMetrics() {
  const rows = dayData.map(r => ({ cnt: parseInt(r.cnt, 10) }));
  const WINDOW = 7;
  const TEST_SIZE = 30;
  const trainEnd = rows.length - TEST_SIZE;

  // Compute SMA-7 (shift 1 to avoid leakage)
  const sma7 = rows.map((r, i) => {
    if (i < WINDOW) return null;
    const slice = rows.slice(i - WINDOW, i); // 7 days BEFORE current
    return Math.round(slice.reduce((s, r) => s + r.cnt, 0) / WINDOW);
  });

  const trainLastVal = rows[trainEnd - 1].cnt;
  let sumAbsMA = 0, sumSqMA = 0, sumAbsNaive = 0, count = 0;

  for (let i = trainEnd; i < rows.length; i++) {
    const actual = rows[i].cnt;
    const ma = sma7[i];
    if (ma === null) continue;
    const naive = trainLastVal;
    sumAbsMA  += Math.abs(actual - ma);
    sumSqMA   += (actual - ma) ** 2;
    sumAbsNaive += Math.abs(actual - naive);
    count++;
  }

  const maeMA    = Math.round((sumAbsMA / count) * 10) / 10;
  const rmseMA   = Math.round(Math.sqrt(sumSqMA / count) * 10) / 10;
  const maeNaive = Math.round((sumAbsNaive / count) * 10) / 10;
  const improvement = Math.round(((maeNaive - maeMA) / maeNaive) * 1000) / 10;
  const totalRides  = rows.reduce((s, r) => s + r.cnt, 0);

  return {
    mae_ma: maeMA,
    mae_naive: maeNaive,
    rmse_ma: rmseMA,
    improvement_pct: improvement,
    total_rides: totalRides,
    total_records: rows.length,
  };
}

// ── 4. Revenue — last 30 days from day.csv ────────────────────
function computeRevenue() {
  const RATE = 280; // ₹280 per ride avg
  const last30 = dayData.slice(-30);
  return {
    date: last30.map(r => r.dteday),
    rides: last30.map(r => parseInt(r.cnt, 10)),
    revenue: last30.map(r => Math.round(parseInt(r.cnt, 10) * RATE)),
  };
}

// ── 5. Hourly demand pattern (avg cnt per hour over full dataset)
function computeHourly() {
  const buckets = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));
  hourData.forEach(r => {
    const hr = parseInt(r.hr, 10);
    const cnt = parseInt(r.cnt, 10);
    const casual = parseInt(r.casual, 10);
    const registered = parseInt(r.registered, 10);
    if (isNaN(hr) || isNaN(cnt)) return;
    buckets[hr].sum += cnt;
    buckets[hr].sumCasual = (buckets[hr].sumCasual || 0) + casual;
    buckets[hr].sumRegistered = (buckets[hr].sumRegistered || 0) + registered;
    buckets[hr].count++;
  });
  return {
    hour: buckets.map((_, i) => `${i}:00`),
    demand: buckets.map(b => b.count ? Math.round(b.sum / b.count) : 0),
    casual: buckets.map(b => b.count ? Math.round((b.sumCasual || 0) / b.count) : 0),
    registered: buckets.map(b => b.count ? Math.round((b.sumRegistered || 0) / b.count) : 0),
  };
}

// ── 6. Seasonal pattern ────────────────────────────────────────
function computeSeasonal() {
  const seasons = { 1: 'Spring', 2: 'Summer', 3: 'Fall', 4: 'Winter' };
  const buckets = { 1: { sum: 0, count: 0 }, 2: { sum: 0, count: 0 }, 3: { sum: 0, count: 0 }, 4: { sum: 0, count: 0 } };
  dayData.forEach(r => {
    const s = parseInt(r.season, 10);
    const cnt = parseInt(r.cnt, 10);
    if (!buckets[s]) return;
    buckets[s].sum += cnt;
    buckets[s].count++;
  });
  return Object.entries(buckets).map(([s, b]) => ({
    season: seasons[s],
    avgDemand: b.count ? Math.round(b.sum / b.count) : 0,
  }));
}

// ── 7. Dataset Stats (replaces MOCK_DATASET_STATS) ────────────
function computeDatasetStats() {
  const hourly = computeHourly();
  const seasonal = computeSeasonal();
  const totalRides = dayData.reduce((s, r) => s + parseInt(r.cnt, 10), 0);
  const avgDaily = Math.round(totalRides / dayData.length);

  // Peak hour = hour with highest avg demand
  const peakHour = hourly.demand.indexOf(Math.max(...hourly.demand));

  // Hourly pattern array (for Dashboard chart)
  const hourlyPattern = hourly.hour.map((h, i) => ({
    hour: i,
    avgDemand: hourly.demand[i],
    avgCasual: hourly.casual[i],
    avgRegistered: hourly.registered[i],
  }));

  // Daily pattern - last 30 days
  const last30 = dayData.slice(-30).map((r, i) => ({
    day: i + 1,
    demand: parseInt(r.cnt, 10),
    casual: parseInt(r.casual, 10),
    registered: parseInt(r.registered, 10),
  }));

  return {
    totalRecords: hourData.length,
    avgDailyRentals: avgDaily,
    peakHour,
    seasons: ['Spring', 'Summer', 'Fall', 'Winter'],
    hourlyPattern,
    seasonalPattern: seasonal,
    dailyPattern: last30,
  };
}

// ── Write all data files ───────────────────────────────────────
const tasks = [
  ['daily.json',        computeDailyPredictions],
  ['weekly.json',       computeWeeklyPredictions],
  ['metrics.json',      computeMetrics],
  ['revenue.json',      computeRevenue],
  ['hourly.json',       computeHourly],
  ['dataset-stats.json', computeDatasetStats],
];

for (const [fileName, fn] of tasks) {
  const data = fn();
  const outPath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`  ✅ ${fileName} written`);
}

console.log('\n🎉 All data files generated in frontend/public/data/');
console.log('   These will be served as static assets on Vercel.');
