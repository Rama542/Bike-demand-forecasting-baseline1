import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import (
    predict_demand, predict_with_arima, recommend_rebalancing,
    suggest_pricing, ai_assistant_logic, get_weather_impact, get_hourly_pattern
)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "ml-layer"})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    history = data.get('history', [])
    use_arima = data.get('use_arima', False)
    
    if use_arima:
        forecast = predict_with_arima(data.get('periods', 3))
    else:
        forecast = predict_demand(history, data.get('periods', 3))
    
    return jsonify({"forecast": forecast})

@app.route('/rebalance', methods=['POST'])
def rebalance():
    data = request.json
    stations = data.get('stations', [])
    recommendations = recommend_rebalancing(stations)
    return jsonify({"recommendations": recommendations})

@app.route('/pricing/dynamic', methods=['POST'])
def dynamic_pricing():
    data = request.json
    station_demand_list = data.get('stations', [])
    pricing_updates = suggest_pricing(station_demand_list)
    return jsonify({"pricing": pricing_updates})

@app.route('/ai/ask', methods=['POST'])
def ai_ask():
    data = request.json
    query = data.get('query', '')
    context_stations = data.get('context', [])
    answer = ai_assistant_logic(query, context_stations)
    return jsonify({"answer": answer})

@app.route('/data/stats', methods=['GET'])
def data_stats():
    """Serve aggregated dataset statistics."""
    hourly_pattern = get_hourly_pattern()
    weather_impact = get_weather_impact()
    return jsonify({
        "hourlyPattern": hourly_pattern,
        "weatherImpact": weather_impact,
    })

@app.route('/data/weather-impact', methods=['GET'])
def weather_impact():
    """Weather impact analysis."""
    return jsonify({"impact": get_weather_impact()})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"\n🧠 VeloAI ML Service starting on port {port}")
    print(f"   Health: http://localhost:{port}/health")
    print(f"   Predict: POST http://localhost:{port}/predict")
    print(f"   Rebalance: POST http://localhost:{port}/rebalance\n")
    app.run(host='0.0.0.0', port=port, debug=True)
