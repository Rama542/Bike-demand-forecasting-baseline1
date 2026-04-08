import pandas as pd
import numpy as np
import os

# Load dataset on import
DATA_DIR = os.path.join(os.path.dirname(__file__), '..') 
HOUR_CSV = os.path.join(DATA_DIR, 'hour.csv')

hourly_df = None
try:
    if os.path.exists(HOUR_CSV):
        hourly_df = pd.read_csv(HOUR_CSV)
        print(f"Loaded {len(hourly_df)} hourly records from {HOUR_CSV}")
except Exception as e:
    print(f"Warning: Could not load hour.csv: {e}")


def predict_demand(history_counts, periods=3):
    """
    Forecasts demand for the next 'periods' hours.
    Uses Simple Moving Average with trend detection.
    Falls back to dataset patterns if available.
    """
    if not history_counts or len(history_counts) == 0:
        # Use dataset average if available
        if hourly_df is not None:
            current_hour = pd.Timestamp.now().hour
            hourly_avg = hourly_df[hourly_df['hr'] == current_hour]['cnt'].mean()
            base = int(hourly_avg) if not pd.isna(hourly_avg) else 150
            return [base + i * 5 for i in range(periods)]
        return [0] * periods
        
    s = pd.Series(history_counts)
    window = min(5, len(s))
    sma = s.rolling(window=window).mean().iloc[-1]
    
    if pd.isna(sma):
        sma = s.mean()
    
    # Detect trend from last few points
    if len(s) >= 3:
        recent = s.iloc[-3:]
        trend = (recent.iloc[-1] - recent.iloc[0]) / 3
    else:
        trend = 0
    
    # Weather adjustment factor (if dataset available)
    weather_factor = 1.0
    if hourly_df is not None:
        current_hour = pd.Timestamp.now().hour
        hour_data = hourly_df[hourly_df['hr'] == current_hour]
        if len(hour_data) > 0:
            avg_temp = hour_data['temp'].mean()
            if avg_temp < 0.2:
                weather_factor = 0.7  # Cold reduces demand
            elif avg_temp > 0.6:
                weather_factor = 1.2  # Warm increases demand
    
    forecast = []
    base_val = sma
    for i in range(periods):
        noise = np.random.uniform(-0.05, 0.05) * base_val
        next_val = max(0, int((base_val + trend * (i + 1) + noise) * weather_factor))
        forecast.append(next_val)
    
    return forecast


def predict_with_arima(periods=3):
    """
    ARIMA-based prediction using the actual dataset.
    Falls back to SMA if statsmodels is not available.
    """
    if hourly_df is None:
        return predict_demand([], periods)
    
    try:
        from statsmodels.tsa.arima.model import ARIMA
        
        # Use last 168 hours (1 week) for ARIMA
        recent_data = hourly_df['cnt'].tail(168).values
        
        model = ARIMA(recent_data, order=(2, 1, 2))
        fitted = model.fit()
        forecast = fitted.forecast(steps=periods)
        
        return [max(0, int(v)) for v in forecast]
    except ImportError:
        print("statsmodels not available, using SMA fallback")
        history = hourly_df['cnt'].tail(24).tolist()
        return predict_demand(history, periods)
    except Exception as e:
        print(f"ARIMA failed: {e}, using SMA fallback")
        history = hourly_df['cnt'].tail(24).tolist()
        return predict_demand(history, periods)


def recommend_rebalancing(stations):
    """
    Returns a list of rebalancing actions.
    stations format: [{'id': 1, 'name': 'A', 'capacity': 20, 'current_bikes': 18}, ...]
    """
    recommendations = []
    over_capacity = []
    under_capacity = []

    for st in stations:
        capacity = st.get('capacity', 0)
        current_bikes = st.get('current_bikes', 0)
        if capacity > 0:
            ratio = current_bikes / float(capacity)
            if ratio > 0.8:
                over_capacity.append(st)
            elif ratio < 0.2:
                under_capacity.append(st)

    # Track current bikes to avoid mutating original objects
    state = {}
    for st in stations:
        state[st.get('id')] = st.get('current_bikes', 0)

    while over_capacity and under_capacity:
        source = over_capacity[-1]
        target = under_capacity[-1]
        
        s_id = source.get('id')
        t_id = target.get('id')
        
        source_cap = source.get('capacity', 0)
        target_cap = target.get('capacity', 0)
        
        target_deficit = int(target_cap * 0.5) - state.get(t_id, 0)
        source_surplus = state.get(s_id, 0) - int(source_cap * 0.5)
        
        move_amount = min(target_deficit, source_surplus)
        if move_amount > 0:
            recommendations.append({
                "action": f"Move {move_amount} bikes from {source.get('name', 'Unknown')} to {target.get('name', 'Unknown')}",
                "source_id": s_id,
                "source_name": source.get('name', 'Unknown'),
                "target_id": t_id,
                "target_name": target.get('name', 'Unknown'),
                "amount": move_amount,
                "priority": "high" if target_deficit > 10 else "medium",
            })
            
            state[s_id] -= move_amount
            state[t_id] += move_amount
            
            if state[s_id] <= int(source_cap * 0.5):
                over_capacity.pop()
            if state.get(t_id, 0) >= int(target_cap * 0.5):
                under_capacity.pop()
        else:
            over_capacity.pop()
            under_capacity.pop()
            
    return recommendations


def suggest_pricing(stations):
    """
    Suggests dynamic pricing multipliers based on availability ratios.
    """
    pricing = []
    for st in stations:
        capacity = st.get('capacity', 0)
        current_bikes = st.get('current_bikes', 0)
        ratio = current_bikes / float(capacity) if capacity > 0 else 0.5
        
        if ratio < 0.15:
            pricing.append({
                "station_id": st.get('id'),
                "name": st.get('name'),
                "suggestion": "Increase price by 25%",
                "multiplier": 1.25,
                "reason": "Very high demand - critically low inventory",
                "severity": "critical"
            })
        elif ratio < 0.3:
            pricing.append({
                "station_id": st.get('id'),
                "name": st.get('name'),
                "suggestion": "Increase price by 15%",
                "multiplier": 1.15,
                "reason": "High demand area",
                "severity": "warning"
            })
        elif ratio > 0.85:
            pricing.append({
                "station_id": st.get('id'),
                "name": st.get('name'),
                "suggestion": "Decrease price by 15%",
                "multiplier": 0.85,
                "reason": "Low demand - too many idle bikes",
                "severity": "info"
            })
        elif ratio > 0.7:
            pricing.append({
                "station_id": st.get('id'),
                "name": st.get('name'),
                "suggestion": "Decrease price by 5%",
                "multiplier": 0.95,
                "reason": "Moderate idle inventory",
                "severity": "info"
            })
        else:
            pricing.append({
                "station_id": st.get('id'),
                "name": st.get('name'),
                "suggestion": "Keep standard pricing",
                "multiplier": 1.0,
                "reason": "Balanced demand",
                "severity": "ok"
            })
    return pricing


def get_weather_impact():
    """
    Analyze weather impact on demand using the dataset.
    """
    if hourly_df is None:
        return {"error": "Dataset not loaded"}
    
    weather_names = {1: 'Clear', 2: 'Cloudy', 3: 'Light Rain', 4: 'Heavy Rain'}
    
    impact = hourly_df.groupby('weathersit')['cnt'].agg(['mean', 'std', 'count']).reset_index()
    result = []
    for _, row in impact.iterrows():
        result.append({
            "weather": weather_names.get(int(row['weathersit']), 'Unknown'),
            "avgDemand": round(row['mean']),
            "stdDev": round(row['std'], 1),
            "sampleSize": int(row['count']),
        })
    return result


def get_hourly_pattern():
    """
    Get average hourly demand pattern from dataset.
    """
    if hourly_df is None:
        return []
    
    hourly = hourly_df.groupby('hr').agg({
        'cnt': 'mean', 'casual': 'mean', 'registered': 'mean'
    }).reset_index()
    
    return [{
        "hour": int(row['hr']),
        "avgDemand": round(row['cnt']),
        "avgCasual": round(row['casual']),
        "avgRegistered": round(row['registered']),
    } for _, row in hourly.iterrows()]


def ai_assistant_logic(query, context_stations):
    """
    Rule-based NLP logic to answer dashboard questions using live station data and dataset insights.
    """
    q = query.lower()
    
    if "where should i move" in q or "rebalance" in q or "redistribute" in q:
        recs = recommend_rebalancing(context_stations)
        if not recs:
            return "✅ All stations are currently well-balanced. No movements needed right now."
        response = "📍 **Rebalancing Recommendations:**\n"
        for r in recs:
            response += f"\n• {r['action']} (Priority: {r['priority']})"
        return response
        
    elif "price" in q or "pricing" in q or "cost" in q:
        prices = suggest_pricing(context_stations)
        increases = [p for p in prices if p['multiplier'] > 1.0]
        decreases = [p for p in prices if p['multiplier'] < 1.0]
        
        response = "💰 **Dynamic Pricing Analysis:**\n"
        if increases:
            response += "\n📈 **Increase prices at:**"
            for p in increases:
                response += f"\n• {p['name']}: {p['suggestion']} ({p['reason']})"
        if decreases:
            response += "\n📉 **Decrease prices at:**"
            for p in decreases:
                response += f"\n• {p['name']}: {p['suggestion']} ({p['reason']})"
        if not increases and not decreases:
            response += "\n✅ All stations have balanced demand. Maintain standard pricing."
        return response
        
    elif "demand" in q or "busy" in q or "popular" in q:
        busy = []
        idle = []
        for st in context_stations:
            cap = st.get('capacity', 0)
            curr = st.get('current_bikes', 0)
            if cap > 0:
                ratio = curr / float(cap)
                if ratio < 0.3:
                    busy.append(st.get('name', 'Unknown'))
                elif ratio > 0.8:
                    idle.append(st.get('name', 'Unknown'))
        
        response = "📊 **Demand Analysis:**\n"
        if busy:
            response += f"\n🔥 High demand (low inventory): {', '.join(busy)}"
        if idle:
            response += f"\n😴 Low demand (high idle): {', '.join(idle)}"
        if not busy and not idle:
            response += "\n✅ Demand is balanced across all stations."
        
        # Add dataset insight
        if hourly_df is not None:
            current_hour = pd.Timestamp.now().hour
            hour_avg = hourly_df[hourly_df['hr'] == current_hour]['cnt'].mean()
            response += f"\n\n📈 Historical average for this hour: ~{int(hour_avg)} rides"
        
        return response
    
    elif "weather" in q or "rain" in q or "forecast" in q:
        if hourly_df is not None:
            clear_avg = hourly_df[hourly_df['weathersit'] == 1]['cnt'].mean()
            rain_avg = hourly_df[hourly_df['weathersit'] == 3]['cnt'].mean()
            response = f"🌤️ **Weather Impact:**\n"
            response += f"\n• Clear weather avg: ~{int(clear_avg)} rides/hr"
            response += f"\n• Rain avg: ~{int(rain_avg)} rides/hr"
            response += f"\n• Rain reduces demand by ~{int((1 - rain_avg/clear_avg) * 100)}%"
            return response
        return "Weather data analysis requires the bike sharing dataset to be loaded."
    
    elif "predict" in q or "forecast" in q or "next" in q:
        forecast = predict_with_arima(3)
        response = "🔮 **Demand Forecast (next 3 hours):**\n"
        for i, v in enumerate(forecast):
            response += f"\n• Hour +{i+1}: ~{v} rides predicted"
        return response
    
    elif "revenue" in q or "earn" in q or "money" in q:
        response = "💵 **Revenue Insights:**\n"
        if hourly_df is not None:
            total_rides = hourly_df['cnt'].sum()
            avg_daily = hourly_df.groupby('dteday')['cnt'].sum().mean()
            response += f"\n• Total rides in dataset: {total_rides:,}"
            response += f"\n• Average daily rides: {int(avg_daily)}"
            response += f"\n• Estimated daily revenue: ${int(avg_daily * 3.50):,} (at $3.50/ride avg)"
        else:
            response += "\nDataset not loaded for historical analysis."
        return response
    
    elif "help" in q or "what can you" in q:
        return """🤖 **I'm your AI Fleet Assistant!** I can help with:

• **Rebalancing**: "Where should I move bikes?"
• **Pricing**: "What should I price at each station?"
• **Demand**: "Which stations are busy?"
• **Weather**: "How does weather affect demand?"
• **Predictions**: "What's the demand forecast?"
• **Revenue**: "How much revenue are we generating?"

Just ask me anything about your fleet operations! 🚲"""
    
    else:
        return "🤖 I can help with rebalancing, dynamic pricing, demand analysis, weather impact, and predictions. Try asking:\n\n• 'Where should I move bikes?'\n• 'What's the pricing recommendation?'\n• 'Which stations are busiest?'\n• 'How does weather affect demand?'"
