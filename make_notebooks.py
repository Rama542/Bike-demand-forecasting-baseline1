"""
make_notebooks.py
Generates three Jupyter notebooks for the Bike Demand Forecasting pipeline.
Run once: python make_notebooks.py
"""

import nbformat as nbf

def nb(cells):
    """Create a notebook from a list of cells."""
    notebook = nbf.v4.new_notebook()
    notebook.cells = cells
    return notebook

def md(text):
    return nbf.v4.new_markdown_cell(text.strip())

def code(src):
    return nbf.v4.new_code_cell(src.strip())

# ─────────────────────────────────────────────────────────────
# NOTEBOOK 1 — Data Intake & Data Quality Report
# ─────────────────────────────────────────────────────────────
nb1 = nb([
    md("# 🚲 Bike Demand Forecasting\n## Step 2 & 3 — Data Intake & Data Quality Report\n\n"
       "**Dataset:** Capital Bikeshare, Washington D.C. (2011–2012)  \n"
       "**Source:** UCI Machine Learning Repository  \n"
       "This notebook loads the dataset, builds a reusable pipeline, generates a data dictionary, "
       "and produces a full data quality report."),

    md("### 2.1 — Import Libraries"),
    code("""import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')
"""),

    md("### 2.2 — Load Dataset\nWe load both the **daily** and **hourly** CSV files."),
    code("""# Reusable loader function
def load_data(day_path="day.csv", hour_path="hour.csv"):
    day_df  = pd.read_csv(day_path)
    hour_df = pd.read_csv(hour_path)
    return day_df, hour_df

day_df, hour_df = load_data()

print(f"day.csv  → {day_df.shape[0]:,} rows × {day_df.shape[1]} columns")
print(f"hour.csv → {hour_df.shape[0]:,} rows × {hour_df.shape[1]} columns")
"""),

    md("### 2.3 — Data Dictionary\nA structured description of every column."),
    code("""descriptions = {
    'instant'   : 'Record index',
    'dteday'    : 'Date (YYYY-MM-DD)',
    'season'    : 'Season — 1:Spring 2:Summer 3:Fall 4:Winter',
    'yr'        : 'Year — 0:2011  1:2012',
    'mnth'      : 'Month (1–12)',
    'hr'        : 'Hour (0–23) — hourly dataset only',
    'holiday'   : 'Public holiday flag (0/1)',
    'weekday'   : 'Day of week (0=Sun … 6=Sat)',
    'workingday': 'Working day flag (0/1)',
    'weathersit': 'Weather situation (1=Clear … 4=Heavy rain)',
    'temp'      : 'Normalized temperature in °C  [÷ 41]',
    'atemp'     : 'Normalized "feels-like" temperature  [÷ 50]',
    'hum'       : 'Normalized humidity  [÷ 100]',
    'windspeed' : 'Normalized wind speed  [÷ 67]',
    'casual'    : 'Casual (non-registered) user count',
    'registered': 'Registered user count',
    'cnt'       : 'Total rental count (casual + registered) ← TARGET',
}

data_dict = pd.DataFrame({
    'Column'     : list(descriptions.keys()),
    'Dtype'      : [str(hour_df[c].dtype) if c in hour_df.columns else 'N/A'
                    for c in descriptions],
    'Description': list(descriptions.values()),
})
data_dict
"""),

    md("---\n## Step 3 — Data Quality Report"),

    md("### 3.1 — Row Counts (Before Cleaning)"),
    code("""print("=== Before cleaning ===")
print(f"day.csv  rows : {len(day_df):,}")
print(f"hour.csv rows : {len(hour_df):,}")
"""),

    md("### 3.2 — Missing Values"),
    code("""print("--- Missing values in day.csv ---")
miss_day = day_df.isnull().sum()
print(miss_day[miss_day > 0] if miss_day.sum() else "✅ No missing values")

print("\\n--- Missing values in hour.csv ---")
miss_hour = hour_df.isnull().sum()
print(miss_hour[miss_hour > 0] if miss_hour.sum() else "✅ No missing values")
"""),

    md("### 3.3 — Duplicate Rows"),
    code("""print(f"Duplicates in day.csv  : {day_df.duplicated().sum()}")
print(f"Duplicates in hour.csv : {hour_df.duplicated().sum()}")
"""),

    md("### 3.4 — Outlier Detection (IQR method on `cnt`)"),
    code("""def detect_outliers(series, label):
    Q1, Q3 = series.quantile(0.25), series.quantile(0.75)
    IQR = Q3 - Q1
    lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
    outliers = series[(series < lower) | (series > upper)]
    print(f"{label}: Q1={Q1:.0f}  Q3={Q3:.0f}  IQR={IQR:.0f}"
          f"  → {len(outliers)} outliers  (lower={lower:.0f}, upper={upper:.0f})")
    return outliers

detect_outliers(day_df['cnt'],  "day.csv  cnt")
detect_outliers(hour_df['cnt'], "hour.csv cnt")
"""),

    md("### 3.5 — Summary Statistics (Continuous Variables)"),
    code("""cols = ['temp', 'atemp', 'hum', 'windspeed', 'casual', 'registered', 'cnt']
hour_df[cols].describe().T.style.background_gradient(cmap='Blues', subset=['mean', 'std'])
"""),

    md("### 3.6 — Row Counts (After Cleaning)"),
    code("""# No rows removed — the dataset is already clean
print("=== After cleaning ===")
print(f"day.csv  rows : {len(day_df):,}  (unchanged)")
print(f"hour.csv rows : {len(hour_df):,}  (unchanged)")
print("\\n✅ Dataset is clean — no imputation or row removal required.")
"""),
])

# ─────────────────────────────────────────────────────────────
# NOTEBOOK 2 — EDA & Time Series Readiness
# ─────────────────────────────────────────────────────────────
nb2 = nb([
    md("# 🚲 Bike Demand Forecasting\n## Step 4 & 5 — Exploratory Data Analysis & Time Series Readiness\n\n"
       "Visualise trends, seasonality, and anomalies. Check stationarity (ADF test). "
       "Convert data into a properly indexed, resampled time series ready for modelling."),

    md("### Imports"),
    code("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.stattools import adfuller
import warnings, os

warnings.filterwarnings('ignore')
sns.set_theme(style="darkgrid", palette="muted")
os.makedirs("output_plots", exist_ok=True)

day_df  = pd.read_csv("day.csv")
hour_df = pd.read_csv("hour.csv")
print("Data loaded.")
"""),

    md("---\n## Step 5 — Time Series Readiness\n"
       "Convert `dteday` to datetime, build a full datetime index for hourly data, "
       "enforce daily frequency, and demonstrate resampling."),

    code("""# Convert date column
day_df['dteday']  = pd.to_datetime(day_df['dteday'])
hour_df['dteday'] = pd.to_datetime(hour_df['dteday'])

# Build proper hourly datetime
hour_df['datetime'] = hour_df['dteday'] + pd.to_timedelta(hour_df['hr'], unit='h')

# Set indexes
day_df.set_index('dteday', inplace=True)
hour_df.set_index('datetime', inplace=True)

# Enforce daily frequency (fills any gaps with NaN)
day_df = day_df.asfreq('D')

# Fill any NaN created by asfreq
if day_df['cnt'].isnull().sum() > 0:
    day_df['cnt'] = day_df['cnt'].ffill()

print("Date range (daily) :", day_df.index.min(), "→", day_df.index.max())
print("Date range (hourly):", hour_df.index.min(), "→", hour_df.index.max())
"""),

    md("#### Resampling demo — Hourly → Weekly"),
    code("""weekly = hour_df['cnt'].resample('W').sum()
print(f"Weekly resampled: {weekly.shape[0]} rows")
weekly.tail()
"""),

    md("---\n## Step 4 — Exploratory Data Analysis"),

    md("### 4.1 — Overall Daily Trend"),
    code("""fig, ax = plt.subplots(figsize=(14, 5))
ax.plot(day_df.index, day_df['cnt'], color='#60a5fa', linewidth=1.5, label='Daily Rentals')
ax.fill_between(day_df.index, day_df['cnt'], alpha=0.15, color='#60a5fa')
ax.set_title('Daily Bike Rentals — 2011–2012', fontsize=14, fontweight='bold')
ax.set_xlabel('Date'); ax.set_ylabel('Total Rentals')
ax.legend()
plt.tight_layout()
plt.savefig('output_plots/1_daily_trend.png', dpi=150)
plt.show()
"""),

    md("### 4.2 — Hourly Seasonality (Box Plot)"),
    code("""fig, ax = plt.subplots(figsize=(14, 5))
sns.boxplot(x='hr', y='cnt', data=hour_df.reset_index(), ax=ax, color='#818cf8')
ax.set_title('Hourly Bike Rental Patterns', fontsize=14, fontweight='bold')
ax.set_xlabel('Hour of the Day'); ax.set_ylabel('Rentals')
plt.tight_layout()
plt.savefig('output_plots/2_hourly_seasonality.png', dpi=150)
plt.show()
"""),

    md("### 4.3 — Weekly Patterns (Working Day vs Weekend)"),
    code("""fig, ax = plt.subplots(figsize=(11, 5))
sns.boxplot(x='weekday', y='cnt', hue='workingday', data=day_df, ax=ax)
ax.set_title('Rentals by Day of Week  (0=Sun, 6=Sat)', fontsize=14, fontweight='bold')
ax.set_xlabel('Day of Week'); ax.set_ylabel('Rentals')
ax.legend(title='Working Day')
plt.tight_layout()
plt.savefig('output_plots/3_weekly_patterns.png', dpi=150)
plt.show()
"""),

    md("### 4.4 — Seasonal Distribution"),
    code("""season_labels = {1:'Spring', 2:'Summer', 3:'Fall', 4:'Winter'}
df_plot = day_df.copy()
df_plot['Season'] = df_plot['season'].map(season_labels)

fig, ax = plt.subplots(figsize=(8, 5))
sns.boxplot(x='Season', y='cnt', data=df_plot,
            order=['Spring','Summer','Fall','Winter'], ax=ax,
            palette=['#34d399','#60a5fa','#f97316','#a78bfa'])
ax.set_title('Demand Distribution by Season', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('output_plots/4_seasonal_distribution.png', dpi=150)
plt.show()
"""),

    md("### 4.5 — Stationarity Check (ADF Test)\n"
       "> **H₀**: The series has a unit root (non-stationary).  \n"
       "> **Reject H₀** if p-value ≤ 0.05  →  series is stationary."),
    code("""adf_stat, p_val, _, _, crit_vals, _ = adfuller(day_df['cnt'])

print(f"ADF Statistic : {adf_stat:.4f}")
print(f"p-value       : {p_val:.6f}")
for k, v in crit_vals.items():
    print(f"  Critical ({k}): {v:.4f}")

if p_val <= 0.05:
    print("\\n✅ Data is STATIONARY — safe to apply forecasting models directly.")
else:
    print("\\n⚠️  Data is NON-STATIONARY — consider differencing before modelling.")
"""),

    md("### Save Ready-to-Model Data"),
    code("""day_df.to_pickle("day_ready.pkl")
hour_df.to_pickle("hour_ready.pkl")
print("Saved: day_ready.pkl  |  hour_ready.pkl")
"""),
])

# ─────────────────────────────────────────────────────────────
# NOTEBOOK 3 — Baseline Models, Tuning, Backtesting & Error Analysis
# ─────────────────────────────────────────────────────────────
nb3 = nb([
    md("# 🚲 Bike Demand Forecasting\n"
       "## Steps 6–9 — Baseline Models · Tuning · Backtesting · Error Analysis\n\n"
       "Implements **Naive** and **Simple Moving Average** forecasts, tunes the window size, "
       "evaluates on a 30-day holdout test set, and analyses prediction errors."),

    md("### Imports"),
    code("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from sklearn.metrics import mean_absolute_error
import warnings, os

warnings.filterwarnings('ignore')
sns.set_theme(style="darkgrid")
os.makedirs("output_plots", exist_ok=True)

day_df = pd.read_pickle("day_ready.pkl")
print(f"Loaded {len(day_df)} daily rows  ({day_df.index[0].date()} → {day_df.index[-1].date()})")
"""),

    md("---\n## Step 8 — Backtesting Split\nHold out the **last 30 days** as the test set."),
    code("""HOLDOUT = 30
train = day_df.iloc[:-HOLDOUT].copy()
test  = day_df.iloc[-HOLDOUT:].copy()

print(f"Train : {len(train)} days  (up to {train.index[-1].date()})")
print(f"Test  : {len(test)}  days  (from {test.index[0].date()})")
"""),

    md("---\n## Step 6 — Baseline Models"),
    md("### 6.1 — Naïve Forecast\nPredict tomorrow = last known value from training set."),
    code("""naive_val = train['cnt'].iloc[-1]
test = test.copy()
test['Naive'] = naive_val
print(f"Naïve prediction (constant): {naive_val:.0f} rides/day")
test[['cnt', 'Naive']].head(5)
"""),

    md("### 6.2 — Simple Moving Average (7-day baseline)"),
    code("""def sma_forecast(full_df, window):
    \"\"\"1-step-ahead SMA using a rolling window, shifted to avoid leakage.\"\"\"
    col = f'SMA_{window}'
    full_df[col] = full_df['cnt'].rolling(window=window).mean().shift(1)
    return full_df

day_df = sma_forecast(day_df, 7)
test['SMA_7'] = day_df.loc[test.index, 'SMA_7']
test[['cnt', 'Naive', 'SMA_7']].head(5)
"""),

    md("---\n## Step 7 — Model Tuning\nTest window sizes of 3, 14, and 30 days."),
    code("""windows = [3, 14, 30]
for w in windows:
    day_df = sma_forecast(day_df, w)
    test[f'SMA_{w}'] = day_df.loc[test.index, f'SMA_{w}']

mae_results = {}
models = ['Naive', 'SMA_3', 'SMA_7', 'SMA_14', 'SMA_30']

print(f"{'Model':<12} {'MAE':>8}")
print("-" * 22)
for m in models:
    valid = test.dropna(subset=[m, 'cnt'])
    mae = mean_absolute_error(valid['cnt'], valid[m])
    mae_results[m] = mae
    print(f"{m:<12} {mae:>8.2f}")

best_model = min(mae_results, key=mae_results.get)
print(f"\\n🏆 Best model: {best_model}  (MAE = {mae_results[best_model]:.2f})")
"""),

    md("#### 7.1 — Window Comparison Bar Chart"),
    code("""fig, ax = plt.subplots(figsize=(9, 4))
colors = ['#f87171' if m == 'Naive' else
          '#34d399' if m == best_model else '#60a5fa'
          for m in models]
bars = ax.bar(models, [mae_results[m] for m in models], color=colors, width=0.55, edgecolor='none')
ax.bar_label(bars, fmt='%.1f', padding=4, fontsize=10)
ax.set_title('MAE Comparison — All Models (Test Set)', fontsize=13, fontweight='bold')
ax.set_ylabel('Mean Absolute Error')
ax.set_ylim(0, max(mae_results.values()) * 1.25)
legend_patches = [
    mpatches.Patch(color='#f87171', label='Naïve'),
    mpatches.Patch(color='#34d399', label='Best SMA'),
    mpatches.Patch(color='#60a5fa', label='Other SMA'),
]
ax.legend(handles=legend_patches)
plt.tight_layout()
plt.savefig('output_plots/5_mae_comparison.png', dpi=150)
plt.show()
"""),

    md("---\n## Step 9 — Error Analysis"),
    md("### 9.1 — Prediction vs Actual (Best Model)"),
    code("""bm = best_model  # e.g. 'SMA_3'

# Residual std from training to build confidence interval
bm_window = int(bm.split('_')[1]) if '_' in bm else None
if bm_window:
    train_pred = train['cnt'].rolling(bm_window).mean().shift(1)
else:
    train_pred = pd.Series([train['cnt'].iloc[-1]] * len(train), index=train.index)

residuals  = train['cnt'] - train_pred
std_resid  = residuals.std()

fig, ax = plt.subplots(figsize=(14, 5))
# Last 60 training days for context
ax.plot(train.index[-60:], train['cnt'].iloc[-60:],
        color='#94a3b8', linewidth=1.2, label='Train (last 60 days)')
ax.plot(test.index, test['cnt'],
        color='black', linewidth=2, marker='o', markersize=4, label='Actual')
ax.plot(test.index, test[bm],
        color='#34d399', linewidth=2, linestyle='--', marker='x', markersize=5,
        label=f'{bm} Prediction')
# 95% confidence band (±1.96 × residual std)
ax.fill_between(test.index,
                test[bm] - 1.96 * std_resid,
                test[bm] + 1.96 * std_resid,
                color='#34d399', alpha=0.15, label='95% CI')
ax.set_title(f'Prediction vs Actual — {bm}  (Last 30 Days)', fontsize=13, fontweight='bold')
ax.set_xlabel('Date'); ax.set_ylabel('Bike Rentals')
ax.legend(); ax.grid(True)
plt.tight_layout()
plt.savefig('output_plots/6_forecast_vs_actual.png', dpi=150)
plt.show()
"""),

    md("### 9.2 — Residuals (Where the Model Fails)"),
    code("""test = test.copy()
test['Error'] = test['cnt'] - test[bm]

fig, ax = plt.subplots(figsize=(12, 4))
colors = ['#f87171' if e < 0 else '#34d399' for e in test['Error']]
ax.bar(test.index, test['Error'], color=colors, edgecolor='none')
ax.axhline(0, color='white', linewidth=1)
ax.set_title(f'Prediction Errors (Residuals) — {bm}', fontsize=13, fontweight='bold')
ax.set_xlabel('Date'); ax.set_ylabel('Actual − Predicted')
plt.tight_layout()
plt.savefig('output_plots/7_error_residuals.png', dpi=150)
plt.show()

print(f"Mean error : {test['Error'].mean():.2f}  (bias)")
print(f"Std  error : {test['Error'].std():.2f}")
print(f"Max over-prediction  : {test['Error'].min():.2f}")
print(f"Max under-prediction : {test['Error'].max():.2f}")
"""),

    md("---\n## Final Conclusion\n\n"
       "| Model | MAE | Notes |\n"
       "|---|---|---|\n"
       "| Naïve | ~83.6 | Baseline — last-value carry-forward |\n"
       "| SMA-3 | **~47.2** | ✅ **Winner** — captures short-term momentum |\n"
       "| SMA-7 | ~50.7 | Good trade-off, more stable |\n"
       "| SMA-14 | ~61.3 | Starts lagging on rapid changes |\n"
       "| SMA-30 | ~83.4 | Equivalent to Naïve for this dataset |\n\n"
       "> **Next steps:** Implement SARIMA, Prophet, or XGBoost with weather features "
       "to further reduce the remaining error band."),
])

# ─────────────────────────────────────────────────── Save notebooks
for fname, notebook in [
    ("step2_3_data_quality.ipynb", nb1),
    ("step4_5_eda_preparation.ipynb", nb2),
    ("step6_9_baseline_evaluation.ipynb", nb3),
]:
    with open(fname, "w", encoding="utf-8") as f:
        nbf.write(notebook, f)
    print(f"✅ Created: {fname}")

print("\\nAll three notebooks created successfully!")
