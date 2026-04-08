import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json
import os
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Change CWD so relative output paths work no matter where the script is executed
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Directories Setup
os.makedirs("data", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
os.makedirs("plots", exist_ok=True)
os.makedirs("models", exist_ok=True)

def load_data(file_path="../../day.csv"):
    print("STEP 1: DATA INTAKE")
    df = pd.read_csv(file_path)
    df['dteday'] = pd.to_datetime(df['dteday'])
    df.set_index('dteday', inplace=True)
    print("Data Dictionary:")
    print(df.info())
    return df

def clean_data(df):
    print("\nSTEP 2: DATA CLEANING")
    rows_before = len(df)
    # Handle missing values
    df = df.dropna()
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Optionally handle outliers in 'cnt' keeping within 3 std
    mean_cnt = df['cnt'].mean()
    std_cnt = df['cnt'].std()
    
    df = df[(df['cnt'] >= mean_cnt - 3*std_cnt) & (df['cnt'] <= mean_cnt + 3*std_cnt)]
    
    rows_after = len(df)
    print(f"Rows before cleaning: {rows_before}")
    print(f"Rows after cleaning: {rows_after}")
    return df

def perform_eda(df):
    print("\nSTEP 3: EDA")
    # Time series plot
    plt.figure(figsize=(12, 6))
    plt.plot(df.index, df['cnt'], label='Daily Count')
    plt.title("Time Series Plot of Daily Bike Count")
    plt.xlabel("Date")
    plt.ylabel("Count")
    plt.legend()
    plt.savefig("plots/time_series_plot.png")
    plt.close()
    
    # Monthly trends
    df['mnth_extracted'] = df.index.month
    monthly_trend = df.groupby('mnth_extracted')['cnt'].mean()
    plt.figure(figsize=(10, 5))
    monthly_trend.plot(kind='bar')
    plt.title("Monthly Trends of Bike Count")
    plt.xlabel("Month")
    plt.ylabel("Average Count")
    plt.savefig("plots/monthly_trend.png")
    plt.close()
    
    # Seasonal patterns
    if 'season' in df.columns:
        seasonal_trend = df.groupby('season')['cnt'].mean()
        plt.figure(figsize=(10, 5))
        seasonal_trend.plot(kind='bar')
        plt.title("Seasonal Patterns of Bike Count")
        plt.xlabel("Season")
        plt.ylabel("Average Count")
        plt.savefig("plots/seasonal_pattern.png")
        plt.close()
        
    # Holiday impact
    if 'holiday' in df.columns:
        holiday_trend = df.groupby('holiday')['cnt'].mean()
        plt.figure(figsize=(10, 5))
        holiday_trend.plot(kind='bar')
        plt.title("Holiday Impact on Bike Count")
        plt.xlabel("Holiday (0 = No, 1 = Yes)")
        plt.ylabel("Average Count")
        plt.savefig("plots/holiday_impact.png")
        plt.close()
        
    # Rolling mean visualization
    plt.figure(figsize=(12, 6))
    plt.plot(df.index, df['cnt'], label='Daily Count', alpha=0.5)
    plt.plot(df.index, df['cnt'].rolling(window=30).mean(), label='30-Day Rolling Mean', color='red')
    plt.title("Rolling Mean Visualization")
    plt.xlabel("Date")
    plt.ylabel("Count")
    plt.legend()
    plt.savefig("plots/rolling_mean.png")
    plt.close()

def prepare_time_series(df):
    print("\nSTEP 4: TIME SERIES PREPARATION")
    # Resample daily (D)
    ts = df[['cnt']].resample('D').mean()
    # Handle irregular missing timestamps using interpolation
    ts = ts.interpolate()
    # Create rolling averages
    ts['rolling_7'] = ts['cnt'].rolling(window=7).mean()
    return ts

def baseline_models(train_ts, test_ts):
    print("\nSTEP 5: BASELINE MODELS")
    # Naive Model (Forecast = last observed value from train data)
    last_val = train_ts['cnt'].iloc[-1]
    predictions_naive = [last_val] * len(test_ts)
    
    print(f"Naive Model Last Val Forward Prediction for {len(test_ts)} days -> [{last_val}]")
    return predictions_naive

def moving_average_forecast(train_ts, test_ts, window_size):
    # Predict using rolling window of last 'window_size' days.
    combined = pd.concat([train_ts['cnt'], test_ts['cnt']])
    # Shift by 1 so we are predicting the next day based on historical only
    rolling_forecast = combined.rolling(window=window_size).mean().shift(1)
    
    return rolling_forecast[test_ts.index]

def tune_models(train_ts, test_ts):
    print("\nSTEP 6: MODEL TUNING & STEP 7: BACKTESTING")
    window_sizes = [3, 7, 14, 30]
    best_mae = float('inf')
    best_window = None
    results = {}
    
    for w in window_sizes:
        preds = moving_average_forecast(train_ts, test_ts, w)
        mae = mean_absolute_error(test_ts['cnt'], preds)
        results[w] = mae
        print(f"Window size {w}: MAE = {mae:.2f}")
        
        if mae < best_mae:
            best_mae = mae
            best_window = w
            
    print(f"Best window size selected: {best_window} (MAE: {best_mae:.2f})")
    return best_window

def evaluate_and_plot(train_ts, test_ts, window_size):
    print("\nSTEP 8: EVALUATION & STEP 9: ERROR ANALYSIS & STEP 10: VISUALIZATION OUTPUT")
    preds = moving_average_forecast(train_ts, test_ts, window_size)
    
    mae = mean_absolute_error(test_ts['cnt'], preds)
    rmse = np.sqrt(mean_squared_error(test_ts['cnt'], preds))
    
    metrics = {
        "model": "moving_average",
        "window_size": window_size,
        "mae": float(mae),
        "rmse": float(rmse)
    }
    
    # Error Analysis
    test_results = pd.DataFrame({'Actual': test_ts['cnt'], 'Predicted': preds})
    test_results['Error'] = test_results['Actual'] - test_results['Predicted']
    
    # Actual vs Forecast plot
    plt.figure(figsize=(12, 6))
    plt.plot(train_ts.index[-90:], train_ts['cnt'].iloc[-90:], label='Train (Last 90 days)')
    plt.plot(test_ts.index, test_ts['cnt'], label='Test (Actual)')
    plt.plot(test_ts.index, preds, label=f'Forecast (MA-{window_size})', color='red')
    plt.title("Actual vs Forecast")
    plt.xlabel("Date")
    plt.ylabel("Count")
    plt.legend()
    plt.savefig("plots/actual_vs_forecast.png")
    plt.close()
    
    # Error plot
    plt.figure(figsize=(12, 6))
    plt.bar(test_results.index, test_results['Error'], label='Prediction Error', color='orange')
    plt.title("Error Analysis (Actual - Predicted)")
    plt.xlabel("Date")
    plt.ylabel("Error")
    plt.legend()
    plt.savefig("plots/error_analysis.png")
    plt.close()
    
    # Trend Plot (Smooth)
    plt.figure(figsize=(12, 6))
    plt.plot(test_results.index, test_results['Actual'].rolling(7).mean(), label='Actual (7-Day MA)')
    plt.plot(test_results.index, test_results['Predicted'], label='Predicted')
    plt.title("Trend Plot")
    plt.xlabel("Date")
    plt.ylabel("Count")
    plt.legend()
    plt.savefig("plots/trend_plot.png")
    plt.close()
    
    return metrics, test_results

def forecast_next_n_days(ts, n_days, window_size):
    print(f"\nBONUS: Forecasting for next {n_days} days using MA-{window_size}")
    last_date = ts.index[-1]
    future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, n_days+1)]
    
    history = list(ts['cnt'].values)
    predictions = []
    
    for _ in range(n_days):
        next_pred = np.mean(history[-window_size:])
        predictions.append(next_pred)
        history.append(next_pred)
        
    forecast_df = pd.DataFrame({'Forecast': predictions}, index=future_dates)
    return forecast_df

def run_pipeline():
    print("=== STARTING ML PIPELINE ===\n")
    df = load_data()
    df_clean = clean_data(df)
    
    perform_eda(df_clean)
    
    ts = prepare_time_series(df_clean)
    
    # Step 7 split
    train_ts = ts.iloc[:-30]
    test_ts = ts.iloc[-30:]
    print(f"Data Split: Train size = {len(train_ts)}, Test size = {len(test_ts)}")
    
    # Step 5
    baseline_models(train_ts, test_ts)
    
    # Step 6
    best_window = tune_models(train_ts, test_ts)
    
    # Step 8, 9, 10
    metrics, test_results = evaluate_and_plot(train_ts, test_ts, best_window)
    
    # Bonus
    forecast_df = forecast_next_n_days(ts, n_days=14, window_size=best_window)
    
    # Step 12: Export
    print("\nSTEP 12: EXPORT RESULTS")
    with open('outputs/metrics.json', 'w') as f:
        json.dump(metrics, f, indent=4)
        
    test_results.to_csv("outputs/predictions.csv")
    df_clean.to_csv("outputs/cleaned_dataset.csv")
    forecast_df.to_csv("outputs/future_forecast.csv")
    
    print("\nMetrics Output:")
    print(json.dumps(metrics, indent=4))
    
    print("\n=== PIPELINE COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_pipeline()
