import pandas as pd
import numpy as np

def run_data_intake_and_quality():
    print("--- 2. Data Intake ---")
    
    # Load daily and hourly dataset
    day_df = pd.read_csv("day.csv")
    hour_df = pd.read_csv("hour.csv")
    
    print(f"Loaded 'day.csv' with shape: {day_df.shape}")
    print(f"Loaded 'hour.csv' with shape: {hour_df.shape}")
    
    print("\n--- Data Dictionary (Hour Dataset) ---")
    data_dict = pd.DataFrame({
        "Column Name": hour_df.columns,
        "Data Type": hour_df.dtypes.values
    })
    print(data_dict.to_string())
    
    print("\n\n--- 3. Data Quality Report ---")
    print("Missing Values - Day Data:")
    print(day_df.isnull().sum()[day_df.isnull().sum() > 0])
    
    print("\nMissing Values - Hour Data:")
    print(hour_df.isnull().sum()[hour_df.isnull().sum() > 0])
    
    print("\nDuplicated Rows - Day Data:", day_df.duplicated().sum())
    print("Duplicated Rows - Hour Data:", hour_df.duplicated().sum())
    
    print("\nSummary Statistics - Hour Data (Continuous Variables):")
    print(hour_df[['temp', 'atemp', 'hum', 'windspeed', 'casual', 'registered', 'cnt']].describe().to_string())

if __name__ == "__main__":
    run_data_intake_and_quality()
