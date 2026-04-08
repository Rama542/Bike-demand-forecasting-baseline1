import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.stattools import adfuller
import os
import warnings
warnings.filterwarnings('ignore')

def run_eda_and_preparation():
    print("--- Loading Data for EDA ---")
    day_df = pd.read_csv("day.csv")
    hour_df = pd.read_csv("hour.csv")
    
    # Create output directory for plots
    os.makedirs("output_plots", exist_ok=True)
    
    # ----------------------------------------------------
    # 5. Time Series Readiness (Done before EDA for better plotting)
    # ----------------------------------------------------
    print("--- 5. Time Series Readiness ---")
    # Convert 'dteday' to datetime
    day_df['dteday'] = pd.to_datetime(day_df['dteday'])
    
    # For hour_df, combine dteday and hr to create a proper datetime index
    hour_df['dteday'] = pd.to_datetime(hour_df['dteday'])
    hour_df['datetime'] = hour_df['dteday'] + pd.to_timedelta(hour_df['hr'], unit='h')
    
    # Set index
    day_df.set_index('dteday', inplace=True)
    hour_df.set_index('datetime', inplace=True)
    
    # Demonstrate Resampling (Hourly to Weekly)
    weekly_resampled = hour_df['cnt'].resample('W').sum()
    print("Resampled data shape (Weekly):", weekly_resampled.shape)
    
    # Ensure there are no irregular timestamps by enforcing frequency on day_df
    day_df = day_df.asfreq('D')
    
    # ----------------------------------------------------
    # 4. Exploratory Data Analysis (EDA)
    # ----------------------------------------------------
    print("--- 4. Exploratory Data Analysis ---")
    
    # Plot 1: Time Series Trend (Daily Count)
    plt.figure(figsize=(14, 6))
    plt.plot(day_df.index, day_df['cnt'], label='Daily Rentals', color='blue')
    plt.title('Daily Bike Rentals Over 2 Years (Trend)')
    plt.xlabel('Date')
    plt.ylabel('Total Rentals (cnt)')
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig('output_plots/1_daily_trend.png')
    plt.close()
    
    # Plot 2: Seasonality & Patterns (Hourly)
    plt.figure(figsize=(12, 6))
    sns.boxplot(x='hr', y='cnt', data=hour_df.reset_index())
    plt.title('Hourly Bike Rental Patterns (Seasonality)')
    plt.xlabel('Hour of the Day')
    plt.ylabel('Rentals')
    plt.tight_layout()
    plt.savefig('output_plots/2_hourly_seasonality.png')
    plt.close()
    
    # Plot 3: Weakly Rentals by Workingday vs Weekend
    plt.figure(figsize=(12, 6))
    sns.boxplot(x='weekday', y='cnt', hue='workingday', data=day_df)
    plt.title('Rentals by Day of Week (0=Sun, 6=Sat)')
    plt.xlabel('Day of Week')
    plt.ylabel('Rentals')
    plt.tight_layout()
    plt.savefig('output_plots/3_weekly_patterns.png')
    plt.close()
    
    # Stationarity Check (ADF Test)
    print("Running Augmented Dickey-Fuller (ADF) Test on Daily Data...")
    # Fill any NaNs created by asfreq before ADF test
    if day_df['cnt'].isnull().sum() > 0:
        day_df['cnt'].fillna(method='ffill', inplace=True)
        
    adf_result = adfuller(day_df['cnt'])
    print(f'ADF Statistic: {adf_result[0]:.4f}')
    print(f'p-value: {adf_result[1]:.4f}')
    for key, value in adf_result[4].items():
        print(f'Critical Value ({key}): {value:.4f}')
        
    if adf_result[1] <= 0.05:
        print("Conclusion: Data is Stationary (Reject Null Hypothesis)")
    else:
        print("Conclusion: Data is Non-Stationary (Fail to Reject Null Hypothesis)")

    # Save cleaned, ready-to-model data
    day_df.to_pickle("day_ready.pkl")
    hour_df.to_pickle("hour_ready.pkl")
    print("Ready-to-model datasets saved as 'day_ready.pkl' and 'hour_ready.pkl'.")

if __name__ == "__main__":
    run_eda_and_preparation()
