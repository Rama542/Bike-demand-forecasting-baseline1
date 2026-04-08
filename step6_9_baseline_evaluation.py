import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import warnings
from sklearn.metrics import mean_absolute_error, mean_squared_error
warnings.filterwarnings('ignore')

def run_baselines_and_evaluation():
    print("--- Loading Ready Data ---")
    day_df = pd.read_pickle("day_ready.pkl")
    
    # Create final evaluation directory
    os.makedirs("output_plots", exist_ok=True)
    
    # ----------------------------------------------------
    # 8. Backtesting (Train/Test Split)
    # We will hold out the last 30 days for testing
    # ----------------------------------------------------
    print("\n--- 8. Backtesting Split ---")
    train_size = len(day_df) - 30
    train = day_df.iloc[:train_size].copy()
    test = day_df.iloc[train_size:].copy()
    
    print(f"Training Data Size: {len(train)} days (Up to {train.index[-1].date()})")
    print(f"Testing Data Size (Last 30 Days): {len(test)} days (From {test.index[0].date()})")
    
    # ----------------------------------------------------
    # 6. Baseline Models
    # ----------------------------------------------------
    print("\n--- 6. Baseline Models ---")
    
    # 6a. Naive Forecast: value tomorrow is value today
    # For testing period, Naive uses the last known value from training repeatedly, 
    # or a 1-step seasonal naive. Let's do simple naive: predict the last value of training
    naive_pred = train['cnt'].iloc[-1]
    test['Naive_Pred'] = naive_pred
    
    # 6b. Simple Moving Average (Baseline Window = 7 Days)
    # For full backtesting dynamically, we calculate SMA on the whole series and subset
    day_df['SMA_7'] = day_df['cnt'].rolling(window=7).mean()
    # Shift by 1 to prevent data leakage (SMA of past 7 days predicts today)
    day_df['SMA_7_Pred'] = day_df['SMA_7'].shift(1)
    
    # Put SMA into test
    test['SMA_7_Pred'] = day_df.loc[test.index, 'SMA_7_Pred']
    
    # ----------------------------------------------------
    # 7. Model Tuning
    # ----------------------------------------------------
    print("\n--- 7. Model Tuning (SMA Windows) ---")
    # Let's try 3-day, 14-day, and 30-day moving averages
    windows = [3, 14, 30]
    
    for w in windows:
        col_name = f'SMA_{w}_Pred'
        day_df[f'SMA_{w}'] = day_df['cnt'].rolling(window=w).mean()
        day_df[col_name] = day_df[f'SMA_{w}'].shift(1)
        test[col_name] = day_df.loc[test.index, col_name]

    # Calculate MAE for all models
    models = ['Naive_Pred', 'SMA_3_Pred', 'SMA_7_Pred', 'SMA_14_Pred', 'SMA_30_Pred']
    mae_scores = {}
    
    for model in models:
        # Dropna in case of boundary issues, though shifted SMA should be valid in test
        valid_test = test.dropna(subset=[model, 'cnt'])
        mae = mean_absolute_error(valid_test['cnt'], valid_test[model])
        mae_scores[model] = mae
        print(f"MAE for {model}: {mae:.2f}")
        
    best_model = min(mae_scores, key=mae_scores.get)
    print(f"\nBest Model: {best_model} with lowest MAE ({mae_scores[best_model]:.2f})")

    # ----------------------------------------------------
    # 9. Error Analysis
    # ----------------------------------------------------
    print("\n--- 9. Error Analysis ---")
    
    # Plot 4: Prediction vs Actual (Last 30 days) for Best Model
    plt.figure(figsize=(12, 6))
    plt.plot(train.index[-60:], train['cnt'].iloc[-60:], label='Train (Last 60 Days)')
    plt.plot(test.index, test['cnt'], label='Actual Test', color='black', linewidth=2, marker='o')
    plt.plot(test.index, test[best_model], label=f'Best Model ({best_model})', color='red', linestyle='--', marker='x')
    
    # Add uncertainty band (Simple standard deviation of residuals from training)
    # Calculate residuals for SMA on train
    train_sma = train['cnt'].rolling(window=int(best_model.split('_')[1])).mean().shift(1)
    residuals = train['cnt'] - train_sma
    std_resid = residuals.std()
    
    plt.fill_between(test.index, 
                     test[best_model] - 1.96 * std_resid, 
                     test[best_model] + 1.96 * std_resid, 
                     color='red', alpha=0.2, label='95% Confidence Interval')
    
    plt.title('Prediction vs Actual Demand (Last 30 Days Test Set)')
    plt.xlabel('Date')
    plt.ylabel('Bike Rentals')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('output_plots/4_forecast_vs_actual.png')
    plt.close()
    
    # Plot 5: Error Residuals over Test Set
    test['ErrorResidual'] = test['cnt'] - test[best_model]
    plt.figure(figsize=(10, 5))
    plt.bar(test.index, test['ErrorResidual'], color=['red' if x < 0 else 'green' for x in test['ErrorResidual']])
    plt.title(f'Prediction Errors (Residuals) for {best_model}')
    plt.axhline(0, color='black')
    plt.xlabel('Date')
    plt.ylabel('Error (Actual - Predicted)')
    plt.tight_layout()
    plt.savefig('output_plots/5_error_residuals.png')
    plt.close()

    print("Baseline tracking, evaluation, and error analysis complete. Plots saved to 'output_plots/'.")

if __name__ == "__main__":
    run_baselines_and_evaluation()
