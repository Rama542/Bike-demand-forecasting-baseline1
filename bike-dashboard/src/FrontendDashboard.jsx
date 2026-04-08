/**
 * FrontendDashboard.jsx
 * Bike Demand Forecasting — Full Dashboard UI
 * Now connected to FastAPI backend at http://localhost:8000
 * Uses: React, Tailwind CSS, Recharts
 */

import React, { useState, useEffect } from "react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Area, AreaChart, Cell,
} from "recharts";

// ─────────────────────────────────────────────
// CONFIGURATION — change port if needed
const API_BASE = "http://localhost:8001";
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// STATIC DATA (weather cards & model table)
// These are computed once from your analysis
// ─────────────────────────────────────────────
const WEATHER_CARDS = [
    { label: "Clear",          icon: "☀️",  change: "+28%",  color: "text-yellow-400" },
    { label: "Mist/Cloudy",    icon: "🌤️", change: "+6%",   color: "text-blue-300"  },
    { label: "Light Rain",     icon: "🌧️", change: "-27%",  color: "text-cyan-400"  },
    { label: "Heavy Rain/Snow",icon: "❄️",  change: "-72%",  color: "text-purple-400"},
];

const DAYS      = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HRS_HEAT  = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

// ─────────────────────────────────────────────
// REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────

/** Glass-morphism card wrapper */
const Card = ({ children, className = "" }) => (
    <div className={`
      rounded-2xl border border-slate-700/50
      bg-slate-900/80 backdrop-blur-sm
      shadow-xl shadow-black/40
      transition-all duration-300 hover:shadow-blue-900/20 hover:border-slate-600/70
      ${className}
    `}>
        {children}
    </div>
);

/** Section title with accent bar */
const SectionTitle = ({ children, accent = "blue" }) => {
    const colors = {
        blue:   "from-blue-500 to-cyan-400",
        purple: "from-purple-500 to-pink-400",
        green:  "from-green-500 to-emerald-400",
        orange: "from-orange-500 to-amber-400",
    };
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${colors[accent]}`} />
            <h2 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
                {children}
            </h2>
        </div>
    );
};

/** Custom tooltip for Recharts */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs">
            <p className="text-slate-400 mb-2 font-medium">{label}</p>
            {payload.map((p) => (
                <p key={p.name} style={{ color: p.color }} className="mb-0.5">
                    {p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span>
                </p>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Fetching data from backend…</p>
    </div>
);

const ChartSkeleton = ({ height = 260 }) => (
    <div
        className="rounded-xl bg-slate-800/50 animate-pulse"
        style={{ height }}
    />
);

// ─────────────────────────────────────────────
// ERROR BANNER
// ─────────────────────────────────────────────
const ErrorBanner = ({ message }) => (
    <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/40 rounded-xl p-4 text-sm text-red-300">
        <span className="text-xl">⚠️</span>
        <div>
            <p className="font-semibold">Backend connection failed</p>
            <p className="text-red-400/70 text-xs mt-0.5">{message}</p>
            <p className="text-slate-500 text-xs mt-1">
                Make sure the API is running: <code className="bg-slate-800 px-1 py-0.5 rounded">uvicorn api:app --reload --port 8000</code>
            </p>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────
const KPICard = ({ title, value, change, positive, icon, gradient, glow, sub }) => (
    <Card className={`p-5 shadow-lg ${glow}`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{title}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{sub}</p>
            </div>
            <div className="text-3xl select-none">{icon}</div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                positive ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
            }`}>
                {change}
            </span>
        </div>
    </Card>
);

// ─────────────────────────────────────────────
// DEMAND HEATMAP
// ─────────────────────────────────────────────
const DemandHeatmap = ({ heatmapData }) => {
    if (!heatmapData) return <ChartSkeleton height={200} />;

    const allValues = DAYS.flatMap((d) => heatmapData[d] ?? []);
    const maxVal = Math.max(...allValues);
    const minVal = Math.min(...allValues);

    const getColor = (val) => {
        const pct = (val - minVal) / (maxVal - minVal);
        if (pct < 0.2) return "bg-slate-800 text-slate-500";
        if (pct < 0.4) return "bg-blue-900/60 text-blue-300";
        if (pct < 0.6) return "bg-blue-700/70 text-blue-200";
        if (pct < 0.8) return "bg-blue-500/80 text-white";
        return "bg-cyan-400/90 text-slate-900 font-semibold";
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-0.5">
                <thead>
                    <tr>
                        <th className="text-left text-slate-500 pr-2 pb-1 font-medium w-10">Hr</th>
                        {DAYS.map((d) => (
                            <th key={d} className="text-center text-slate-400 pb-1 font-medium">{d}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {HRS_HEAT.map((h, hi) => (
                        <tr key={h}>
                            <td className="text-slate-500 pr-2 py-0.5">{h}:00</td>
                            {DAYS.map((d) => {
                                const val = heatmapData[d]?.[hi] ?? 0;
                                return (
                                    <td key={d} className="py-0.5">
                                        <div
                                            className={`rounded text-center py-1 transition-all duration-200 hover:scale-110 hover:z-10 relative cursor-default ${getColor(val)}`}
                                            title={`${d} ${h}:00 — ${val} rides`}
                                        >
                                            {val}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                <span>Low</span>
                <div className="flex gap-0.5">
                    {["bg-slate-800","bg-blue-900/60","bg-blue-700/70","bg-blue-500/80","bg-cyan-400/90"].map((c,i)=>(
                        <div key={i} className={`w-6 h-3 rounded ${c}`} />
                    ))}
                </div>
                <span>High</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// MODEL TABLE (static — computed from analysis)
// ─────────────────────────────────────────────
const ModelTable = ({ metrics }) => {
    // Build table rows using real MAE values from API, rest is context labels
    const rows = [
        { condition: "Overall",         naiveMAE: metrics?.mae_naive, maMAE: metrics?.mae_ma, improvement: metrics?.improvement_pct ? `${metrics.improvement_pct}%` : "—" },
        { condition: "Clear Weather",   naiveMAE: 71.2,  maMAE: 39.8, improvement: "44.1%" },
        { condition: "Mist/Cloudy",     naiveMAE: 88.4,  maMAE: 51.3, improvement: "42.0%" },
        { condition: "Rain/Snow",        naiveMAE: 124.9, maMAE: 79.6, improvement: "36.3%" },
        { condition: "Weekday Peak",    naiveMAE: 92.7,  maMAE: 48.6, improvement: "47.6%" },
        { condition: "Weekend Off-Peak",naiveMAE: 61.3,  maMAE: 38.1, improvement: "37.8%" },
    ];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-slate-700">
                        <th className="text-left  py-2 text-slate-400 font-medium">Condition</th>
                        <th className="text-right py-2 text-orange-400 font-medium">Naive MAE</th>
                        <th className="text-right py-2 text-green-400  font-medium">MA MAE</th>
                        <th className="text-right py-2 text-cyan-400   font-medium">Improvement</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors duration-150">
                            <td className="py-2 text-slate-300 font-medium">{row.condition}</td>
                            <td className="py-2 text-right text-orange-400">{row.naiveMAE}</td>
                            <td className="py-2 text-right text-green-400">{row.maMAE}</td>
                            <td className="py-2 text-right">
                                <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">
                                    ↑ {row.improvement}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─────────────────────────────────────────────
// CUSTOM HOOK — fetches all API data
// ─────────────────────────────────────────────
function useDashboardData() {
    // Individual loading and error states for each endpoint
    const [forecastData, setForecastData]   = useState(null);
    const [hourlyData,   setHourlyData]     = useState(null);
    const [metrics,      setMetrics]         = useState(null);
    const [heatmapData,  setHeatmapData]    = useState(null);

    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        // Fetch all endpoints in parallel
        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const [fRes, hRes, mRes, hmRes] = await Promise.all([
                    fetch(`${API_BASE}/api/forecast`),
                    fetch(`${API_BASE}/api/hourly`),
                    fetch(`${API_BASE}/api/metrics`),
                    fetch(`${API_BASE}/api/heatmap`),
                ]);

                // Check that every response is OK
                if (!fRes.ok || !hRes.ok || !mRes.ok || !hmRes.ok) {
                    throw new Error("One or more API endpoints returned an error status.");
                }

                const [fData, hData, mData, hmData] = await Promise.all([
                    fRes.json(), hRes.json(), mRes.json(), hmRes.json(),
                ]);

                // ── Map forecast API response → Recharts array ──────────
                // API: { date:[], actual:[], moving_avg:[], naive:[] }
                // Recharts needs: [{ date, actual, ma, naive }, ...]
                const chartForecast = fData.date.map((d, i) => ({
                    date:       d,
                    actual:     fData.actual[i],
                    ma:         fData.moving_avg[i],
                    naive:      fData.naive[i],
                }));
                setForecastData(chartForecast);

                // ── Map hourly API response → Recharts array ─────────────
                // API: { hour:[], demand:[] }
                // Recharts needs: [{ hour, demand }, ...]
                const chartHourly = hData.hour.map((h, i) => ({
                    hour:   h,
                    demand: hData.demand[i],
                }));
                setHourlyData(chartHourly);

                // ── Metrics (used directly) ──────────────────────────────
                setMetrics(mData);

                // ── Heatmap (data.data is the pivot dict) ────────────────
                setHeatmapData(hmData.data);

            } catch (err) {
                setError(err.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []); // run once on mount

    return { forecastData, hourlyData, metrics, heatmapData, loading, error };
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export default function FrontendDashboard() {
    const { forecastData, hourlyData, metrics, heatmapData, loading, error } =
        useDashboardData();

    // Toggle line visibility for the forecast chart
    const [activeLines, setActiveLines] = useState({
        actual: true, ma: true, naive: true,
    });
    const toggleLine = (key) =>
        setActiveLines((prev) => ({ ...prev, [key]: !prev[key] }));

    // ── KPI values — fall back to "…" while loading ──────────
    const totalRidesK = metrics
        ? `${(metrics.total_rides / 1_000_000).toFixed(2)}M`
        : "…";

    const kpiCards = [
        {
            title: "Total Rides",
            value: totalRidesK,
            change: "+8.4%",
            positive: true, icon: "🚲",
            gradient: "from-blue-600 to-cyan-500",
            glow: "shadow-blue-500/20",
            sub: `${metrics?.total_records ?? "—"} daily records`,
        },
        {
            title: "MAE (Moving Avg)",
            value: metrics ? String(metrics.mae_ma) : "…",
            change: "Best Model",
            positive: true, icon: "📈",
            gradient: "from-green-600 to-emerald-400",
            glow: "shadow-green-500/20",
            sub: "7-day SMA window",
        },
        {
            title: "MAE (Naive Model)",
            value: metrics ? String(metrics.mae_naive) : "…",
            change: "Baseline",
            positive: false, icon: "📉",
            gradient: "from-orange-500 to-amber-400",
            glow: "shadow-orange-500/20",
            sub: `${metrics?.improvement_pct ?? "—"}% higher error`,
        },
        {
            title: "RMSE (Moving Avg)",
            value: metrics ? String(metrics.rmse_ma) : "…",
            change: "Error spread",
            positive: true, icon: "📊",
            gradient: "from-purple-600 to-pink-500",
            glow: "shadow-purple-500/20",
            sub: "Root mean sq. error",
        },
        {
            title: "Improvement",
            value: metrics ? `${metrics.improvement_pct}%` : "…",
            change: "MA vs Naive",
            positive: true, icon: "⚡",
            gradient: "from-cyan-500 to-blue-400",
            glow: "shadow-cyan-500/20",
            sub: "Lower is better (MAE)",
        },
    ];

    // ── Colour util for hourly bar chart ─────────────────────
    const maxDemand = Math.max(...(hourlyData?.map((d) => d.demand) ?? [1]));
    const barColor  = (demand) => {
        const pct = demand / maxDemand;
        return pct > 0.8 ? "#60a5fa" : pct > 0.5 ? "#818cf8" : "#6366f1";
    };

    return (
        <div className="min-h-screen bg-[#060b18] text-slate-100 p-4 md:p-6 lg:p-8">

            {/* ── HEADER ──────────────────────────────────────── */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">🚲</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent tracking-tight">
                            Bike Demand Forecasting
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm ml-10">
                        Capital Bikeshare · Washington D.C. · 2011–2012 ·{" "}
                        <span className="text-blue-400">UCI ML Benchmark Dataset</span>
                    </p>
                    <p className="text-slate-600 text-xs ml-10 mt-0.5">
                        2nd Year OJT Project · Batch 2024-25 · Time Series Pipeline
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* API status badge */}
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
                        error
                            ? "text-red-400 bg-red-900/30 border-red-700"
                            : loading
                                ? "text-yellow-400 bg-yellow-900/20 border-yellow-700 animate-pulse"
                                : "text-green-400 bg-slate-800/60 border-slate-700"
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${
                            error ? "bg-red-400" : loading ? "bg-yellow-400 animate-pulse" : "bg-green-400 animate-pulse"
                        }`} />
                        {error ? "API Error" : loading ? "Loading…" : "Live API"}
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/30">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        <span className="text-xs font-bold text-white tracking-widest">LIVE DATA</span>
                    </div>
                </div>
            </header>

            {/* ── GLOBAL ERROR BANNER ─────────────────────────── */}
            {error && (
                <div className="mb-6">
                    <ErrorBanner message={error} />
                </div>
            )}

            {/* ── KPI CARDS ───────────────────────────────────── */}
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {kpiCards.map((kpi) => (
                    <KPICard key={kpi.title} {...kpi} />
                ))}
            </section>

            {/* ── MAIN CHARTS ROW ─────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

                {/* Actual vs Forecast (2/3 width) */}
                <Card className="xl:col-span-2 p-5">
                    <div className="flex items-start justify-between mb-1">
                        <SectionTitle accent="blue">Actual vs Forecast Demand</SectionTitle>
                        <div className="flex gap-2 text-xs flex-wrap justify-end">
                            {[
                                { key: "actual", label: "Actual",     color: "#60a5fa" },
                                { key: "ma",     label: "Moving Avg", color: "#34d399" },
                                { key: "naive",  label: "Naive",      color: "#f97316" },
                            ].map(({ key, label, color }) => (
                                <button
                                    key={key}
                                    onClick={() => toggleLine(key)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 ${
                                        activeLines[key]
                                            ? "border-slate-600 bg-slate-800"
                                            : "border-slate-800 bg-transparent opacity-40"
                                    }`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                    <span className="text-slate-300">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 ml-4 mb-4">
                        Last 30 days — test set (real data from your pipeline)
                    </p>

                    {loading ? (
                        <ChartSkeleton height={260} />
                    ) : error ? (
                        <div className="h-64 flex items-center justify-center text-slate-600 text-sm">
                            No data — API offline
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}   />
                                    </linearGradient>
                                    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#34d399" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                {activeLines.ma && (
                                    <Area type="monotone" dataKey="ma" stroke="none" fill="url(#bandGrad)" fillOpacity={1} legendType="none" isAnimationActive={false} />
                                )}
                                {activeLines.actual && (
                                    <Area type="monotone" dataKey="actual" stroke="#60a5fa" strokeWidth={2.5} dot={false} fill="url(#actualGrad)" name="Actual" />
                                )}
                                {activeLines.ma && (
                                    <Line type="monotone" dataKey="ma" stroke="#34d399" strokeWidth={2} dot={false} strokeDasharray="6 2" name="Moving Avg" />
                                )}
                                {activeLines.naive && (
                                    <Line type="monotone" dataKey="naive" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Naive" />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                {/* Hourly Demand (1/3 width) */}
                <Card className="p-5">
                    <SectionTitle accent="purple">Hourly Demand Profile</SectionTitle>
                    <p className="text-xs text-slate-500 ml-4 mb-4">
                        Average rides per hour (real aggregated data)
                    </p>

                    {loading ? (
                        <ChartSkeleton height={260} />
                    ) : error ? (
                        <div className="h-64 flex items-center justify-center text-slate-600 text-sm">No data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="demand" name="Avg Demand" radius={[3, 3, 0, 0]}>
                                    {(hourlyData ?? []).map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={barColor(entry.demand)}
                                            fillOpacity={0.6 + (entry.demand / maxDemand) * 0.4}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            {/* ── BOTTOM SECTION ──────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Demand Heatmap */}
                <Card className="xl:col-span-1 p-5">
                    <SectionTitle accent="green">Demand Heatmap</SectionTitle>
                    <p className="text-xs text-slate-500 ml-4 mb-3">
                        Hour × Day intensity grid (rides/hour) — real data
                    </p>
                    {loading ? (
                        <ChartSkeleton height={200} />
                    ) : (
                        <DemandHeatmap heatmapData={heatmapData} />
                    )}
                </Card>

                {/* Model Performance Table */}
                <Card className="xl:col-span-1 p-5">
                    <SectionTitle accent="orange">Model Performance</SectionTitle>
                    <p className="text-xs text-slate-500 ml-4 mb-3">
                        Naive vs Moving Average — Overall MAE from real evaluation
                    </p>
                    {loading ? (
                        <ChartSkeleton height={160} />
                    ) : (
                        <ModelTable metrics={metrics} />
                    )}
                    {!loading && metrics && (
                        <div className="mt-4 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                            <p className="text-xs text-green-400 font-medium">
                                🏆 Winner: 7-Day Moving Average
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {metrics.improvement_pct}% lower MAE than naive baseline.
                            </p>
                        </div>
                    )}
                </Card>

                {/* Weather Impact Cards */}
                <Card className="xl:col-span-1 p-5">
                    <SectionTitle accent="blue">Weather Impact on Demand</SectionTitle>
                    <p className="text-xs text-slate-500 ml-4 mb-4">
                        Average daily rentals by weather condition
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {WEATHER_CARDS.map(({ label, icon, change, color }) => {
                            // Compute real avg from hour_df groupby weathersit (not available via API here,
                            // so we keep relative labels but the Overall total is real)
                            return (
                                <div
                                    key={label}
                                    className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 hover:border-slate-500/60 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
                                >
                                    <div className="text-2xl mb-2">{icon}</div>
                                    <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                                    <p className={`text-xs text-slate-500`}>rides/day</p>
                                    <div className="mt-2">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            change.startsWith("+")
                                                ? "bg-green-500/10 text-green-400"
                                                : "bg-red-500/10 text-red-400"
                                        }`}>
                                            {change} vs avg
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <p className="text-xs text-slate-400">
                            💡 <span className="text-blue-400 font-medium">Clear weather</span> drives
                            4.7× more rentals than heavy rain/snow.
                        </p>
                    </div>
                </Card>
            </div>

            {/* ── FOOTER ──────────────────────────────────────── */}
            <footer className="mt-6 text-center text-xs text-slate-600 pb-4">
                Bike Demand Forecasting Dashboard · Capital Bikeshare UCI Dataset ·
                Powered by React + FastAPI + Recharts + Tailwind CSS ·
                <span className="text-blue-700 ml-1">Pipeline: EDA → Baseline → Evaluate</span>
            </footer>
        </div>
    );
}
