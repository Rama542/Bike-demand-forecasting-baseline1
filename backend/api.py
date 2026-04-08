"""
api.py — Bike Demand Forecasting · FastAPI Backend
===================================================
Reads directly from day.csv and hour.csv (no pickle dependency).
Works reliably regardless of pandas version.

Start server:
    pip install fastapi uvicorn pandas numpy scikit-learn
    python -m uvicorn api:app --reload --port 8000
"""

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="Bike Demand Forecasting API", version="1.0.0")

# Allow the React dev server (port 5173) to call us — no CORS errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Helper: load & prepare data (cached at module level for speed)
# ─────────────────────────────────────────────────────────────
def _prepare_data():
    """
    Load from CSV, apply the same pipeline as step4_5 and step6_9,
    compute baseline models — runs once on startup.
    """
    # ── Load CSVs (same as your pipeline) ────────────────────
    day_df  = pd.read_csv("day.csv")
    hour_df = pd.read_csv("hour.csv")

    # ── Time series readiness (mirrors step4_5) ──────────────
    day_df["dteday"]  = pd.to_datetime(day_df["dteday"])
    hour_df["dteday"] = pd.to_datetime(hour_df["dteday"])

    day_df.set_index("dteday", inplace=True)
    hour_df["datetime"] = hour_df["dteday"] + pd.to_timedelta(hour_df["hr"], unit="h")
    hour_df.set_index("datetime", inplace=True)

    # Fill any NaNs
    day_df["cnt"] = day_df["cnt"].ffill().bfill()

    # ── Backtesting split (last 30 days = test) ──────────────
    train_size = len(day_df) - 30
    train = day_df.iloc[:train_size].copy()
    test  = day_df.iloc[train_size:].copy()

    # ── Baseline models ───────────────────────────────────────
    # 1) Naive: last training value repeated
    test["naive"] = float(train["cnt"].iloc[-1])

    # 2) 7-day SMA (shift by 1 to avoid leakage)
    day_df["sma_7"]      = day_df["cnt"].rolling(window=7).mean()
    day_df["sma_7_pred"] = day_df["sma_7"].shift(1)
    test["moving_avg"]   = day_df.loc[test.index, "sma_7_pred"]

    # ── Metrics ───────────────────────────────────────────────
    valid = test.dropna(subset=["moving_avg", "naive", "cnt"])

    mae_ma    = mean_absolute_error(valid["cnt"], valid["moving_avg"])
    mae_naive = mean_absolute_error(valid["cnt"], valid["naive"])
    rmse_ma   = float(np.sqrt(mean_squared_error(valid["cnt"], valid["moving_avg"])))

    improvement_pct = round((mae_naive - mae_ma) / mae_naive * 100, 1)

    return day_df, hour_df, train, test, valid, {
        "mae_ma":          round(mae_ma, 2),
        "mae_naive":       round(mae_naive, 2),
        "rmse_ma":         round(rmse_ma, 2),
        "improvement_pct": improvement_pct,
        "total_rides":     int(day_df["cnt"].sum()),
        "total_records":   len(day_df),
    }


# Load once when the module is imported
print("📊 Loading and processing bike sharing data...")
_day_df, _hour_df, _train, _test, _valid, _metrics = _prepare_data()
print(f"✅ Data ready — {_metrics['total_records']} daily records, "
      f"MAE(MA)={_metrics['mae_ma']}, MAE(Naive)={_metrics['mae_naive']}")


# ─────────────────────────────────────────────────────────────
# ENDPOINT 1 — /predict/daily
# Returns the last 30-day test set predictions
# ─────────────────────────────────────────────────────────────
@app.get("/predict/daily")
def get_daily():
    df = _valid.copy()
    return {
        "date":       [d.strftime("%b %d") for d in df.index],
        "predictions": [int(round(v)) for v in df["moving_avg"].tolist()]
    }

# ─────────────────────────────────────────────────────────────
# ENDPOINT 1.5 — /predict/weekly
# Returns weekly aggregated predictions
# ─────────────────────────────────────────────────────────────
@app.get("/predict/weekly")
def get_weekly():
    df = _valid.copy()
    weekly_avg = df.resample("W").mean().dropna()
    return {
        "date":       [f"Week of {d.strftime('%b %d')}" for d in weekly_avg.index],
        "predictions": [int(round(v)) for v in weekly_avg["moving_avg"].tolist()]
    }


# ─────────────────────────────────────────────────────────────
# ENDPOINT 2 — /api/hourly
# Average rides per hour-of-day (aggregated over all 2 years)
# ─────────────────────────────────────────────────────────────
@app.get("/api/hourly")
def get_hourly():
    """
    Response shape
    --------------
    {
        "hour":   ["0:00", "1:00", ...],   // 24 items
        "demand": [65, 42, ...]
    }
    """
    hourly_avg = (
        _hour_df
        .groupby(_hour_df.index.hour)["cnt"]
        .mean()
        .round()
        .astype(int)
    )

    return {
        "hour":   [f"{h}:00" for h in hourly_avg.index.tolist()],
        "demand": hourly_avg.tolist(),
    }


# ─────────────────────────────────────────────────────────────
# ENDPOINT 3 — /api/metrics
# KPI summary for the dashboard cards
# ─────────────────────────────────────────────────────────────
@app.get("/api/metrics")
def get_metrics():
    """
    Response shape
    --------------
    {
        "mae_ma":           47.2,
        "mae_naive":        83.6,
        "rmse_ma":          62.1,
        "improvement_pct":  43.5,
        "total_rides":      3292679,
        "total_records":    731
    }
    """
    return _metrics


# ─────────────────────────────────────────────────────────────
# ENDPOINT 4 — /api/heatmap  (hour × weekday matrix)
# ─────────────────────────────────────────────────────────────
@app.get("/api/heatmap")
def get_heatmap():
    """
    Response shape
    --------------
    {
        "days":  ["Mon", "Tue", ...],
        "hours": [6, 7, 8, ...],
        "data":  { "Mon": [250, 400, ...], ... }
    }
    """
    DAY_MAP  = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}
    SHOW_HRS = list(range(6, 21))          # 06:00 – 20:00

    df = _hour_df.copy()
    df["weekday_name"] = df.index.weekday.map(DAY_MAP)
    df["hour_val"]     = df.index.hour

    pivot = (
        df[df["hour_val"].isin(SHOW_HRS)]
        .groupby(["weekday_name", "hour_val"])["cnt"]
        .mean()
        .round()
        .astype(int)
        .unstack(level="hour_val")
    )

    days   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    result = {}
    for day in days:
        if day in pivot.index:
            result[day] = pivot.loc[day, SHOW_HRS].tolist()

    return {
        "days":  days,
        "hours": SHOW_HRS,
        "data":  result,
    }


# ─────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────
@app.get("/health")
@app.get("/")
def health():
    return {
        "status":  "ok",
        "message": "Bike Demand Forecasting API is running on port 5000 🚲",
        "endpoints": ["/health", "/predict/daily", "/predict/weekly"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
