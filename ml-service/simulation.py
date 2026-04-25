import time
import requests
import random
import math
import datetime

BACKEND_URL = "http://localhost:5000/api/simulate/update"
OPENMETEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=12.9716&longitude=77.5946"
    "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature"
    "&timezone=Asia/Kolkata&forecast_days=1"
)

# Bangalore stations with real GPS coordinates
stations_mock = [
    {"id": 1, "name": "Indiranagar",    "lat": 12.9784, "lng": 77.6408, "capacity": 50, "current_bikes": 25},
    {"id": 2, "name": "Koramangala",    "lat": 12.9352, "lng": 77.6245, "capacity": 40, "current_bikes": 22},
    {"id": 3, "name": "MG Road",        "lat": 12.9758, "lng": 77.6082, "capacity": 30, "current_bikes": 8},
    {"id": 4, "name": "Whitefield",     "lat": 12.9698, "lng": 77.7499, "capacity": 35, "current_bikes": 15},
    {"id": 5, "name": "HSR Layout",     "lat": 12.9063, "lng": 77.6383, "capacity": 60, "current_bikes": 52},
    {"id": 6, "name": "Jayanagar",      "lat": 12.9299, "lng": 77.5939, "capacity": 45, "current_bikes": 20},
    {"id": 7, "name": "Malleshwaram",   "lat": 13.0031, "lng": 77.5643, "capacity": 35, "current_bikes": 28},
    {"id": 8, "name": "Electronic City","lat": 12.8399, "lng": 77.6770, "capacity": 25, "current_bikes": 4},
]

# Bikes assigned to stations
bikes_mock = []
bike_id = 1
for st in stations_mock:
    for _ in range(st['capacity'] // 5):
        status_choices = ['idle', 'idle', 'idle', 'in-use', 'in-use', 'maintenance']
        bikes_mock.append({
            'id': bike_id,
            'station_id': st['id'],
            'status': random.choice(status_choices),
            'battery_level': random.randint(30, 100),
            'lat': st['lat'] + random.uniform(-0.004, 0.004),
            'lng': st['lng'] + random.uniform(-0.004, 0.004),
        })
        bike_id += 1

tick = 0
revenue_today = 0

# Cached real weather (refreshed every 10 minutes)
_weather_cache = {"data": None, "fetched_at": 0}

WEATHER_CODE_MAP = {
    0:  {"type": "clear",   "label": "Clear Sky",     "icon": "☀️"},
    1:  {"type": "clear",   "label": "Mainly Clear",   "icon": "🌤️"},
    2:  {"type": "cloudy",  "label": "Partly Cloudy",  "icon": "⛅"},
    3:  {"type": "cloudy",  "label": "Overcast",       "icon": "☁️"},
    45: {"type": "fog",     "label": "Foggy",          "icon": "🌫️"},
    48: {"type": "fog",     "label": "Icy Fog",        "icon": "🌫️"},
    51: {"type": "drizzle", "label": "Light Drizzle",  "icon": "🌦️"},
    53: {"type": "drizzle", "label": "Drizzle",        "icon": "🌦️"},
    55: {"type": "drizzle", "label": "Heavy Drizzle",  "icon": "🌦️"},
    61: {"type": "rain",    "label": "Light Rain",     "icon": "🌧️"},
    63: {"type": "rain",    "label": "Rain",           "icon": "🌧️"},
    65: {"type": "rain",    "label": "Heavy Rain",     "icon": "🌧️"},
    80: {"type": "rain",    "label": "Rain Showers",   "icon": "🌧️"},
    81: {"type": "rain",    "label": "Rain Showers",   "icon": "🌧️"},
    82: {"type": "rain",    "label": "Rain Showers",   "icon": "🌧️"},
    95: {"type": "storm",   "label": "Thunderstorm",   "icon": "⛈️"},
    96: {"type": "storm",   "label": "Thunderstorm",   "icon": "⛈️"},
    99: {"type": "storm",   "label": "Thunderstorm",   "icon": "⛈️"},
}

def fetch_bangalore_weather():
    now = time.time()
    # Use cached data if younger than 10 minutes
    if _weather_cache["data"] and (now - _weather_cache["fetched_at"]) < 600:
        return _weather_cache["data"]

    try:
        resp = requests.get(OPENMETEO_URL, timeout=5)
        resp.raise_for_status()
        raw = resp.json()

        current = raw.get("current", {})
        code    = int(current.get("weather_code", 0))
        temp    = current.get("temperature_2m", 28)
        humid   = current.get("relative_humidity_2m", 60)
        wind    = current.get("wind_speed_10m", 10)
        feels   = current.get("apparent_temperature", temp)

        info = WEATHER_CODE_MAP.get(code, WEATHER_CODE_MAP[0])

        weather = {
            "type":     info["type"],
            "label":    info["label"],
            "icon":     info["icon"],
            "temp":     round(temp),
            "feelsLike": round(feels),
            "humidity": round(humid),
            "wind":     round(wind),
            "code":     code,
        }

        _weather_cache["data"]       = weather
        _weather_cache["fetched_at"] = now
        print(f"[Weather] Live: {weather['icon']} {weather['label']}, {weather['temp']}°C, humidity {weather['humidity']}%")
        return weather

    except Exception as e:
        print(f"[Weather] Failed to fetch live weather: {e}. Using fallback.")
        fallback = {"type": "clear", "label": "Clear Sky", "icon": "☀️", "temp": 28, "feelsLike": 28, "humidity": 55, "wind": 12, "code": 0}
        _weather_cache["data"] = fallback
        _weather_cache["fetched_at"] = now - 540  # retry sooner
        return fallback


def get_demand_factor(weather):
    """Compute realistic demand factor from time-of-day AND real live weather."""
    hour = datetime.datetime.now().hour

    # Time-of-day base factor (Bangalore commute pattern)
    if 7 <= hour <= 9:
        time_factor = 1.6   # morning rush
    elif 17 <= hour <= 19:
        time_factor = 1.9   # evening rush
    elif 10 <= hour <= 16:
        time_factor = 1.2   # midday
    elif 20 <= hour <= 22:
        time_factor = 0.8   # evening
    else:
        time_factor = 0.35  # night/early morning

    # Weather adjustment
    wtype = weather.get("type", "clear")
    temp  = weather.get("temp", 28)

    weather_mult = {
        "clear":   1.15,
        "cloudy":  1.00,
        "fog":     0.80,
        "drizzle": 0.65,
        "rain":    0.50,
        "storm":   0.30,
    }.get(wtype, 1.0)

    # Temperature comfort (Bangalore: ideal ~22-28°C)
    if temp < 18:
        temp_mult = 0.85
    elif temp <= 30:
        temp_mult = 1.05
    elif temp <= 35:
        temp_mult = 0.90
    else:
        temp_mult = 0.75

    return time_factor * weather_mult * temp_mult


def simulate_step(weather):
    global tick, revenue_today
    tick += 1

    demand_factor = get_demand_factor(weather)

    # Update station bike counts
    for st in stations_mock:
        max_change = max(1, int(st['capacity'] * 0.08 * demand_factor))
        change = random.randint(-max_change, max_change)
        if demand_factor > 1.3:
            change -= random.randint(0, 2)
        st['current_bikes'] = max(0, min(st['capacity'], st['current_bikes'] + change))

    # Update bike GPS positions
    for bike in bikes_mock:
        station = next((s for s in stations_mock if s['id'] == bike['station_id']), None)
        if station:
            if bike['status'] == 'in-use':
                bike['lat'] += random.uniform(-0.001, 0.001)
                bike['lng'] += random.uniform(-0.001, 0.001)
                bike['battery_level'] = max(0, bike['battery_level'] - random.randint(0, 2))
                if random.random() < 0.15:
                    bike['status'] = 'idle'
                    new_station = random.choice(stations_mock)
                    bike['station_id'] = new_station['id']
                    bike['lat'] = new_station['lat'] + random.uniform(-0.002, 0.002)
                    bike['lng'] = new_station['lng'] + random.uniform(-0.002, 0.002)
            elif bike['status'] == 'idle':
                ride_chance = 0.05 * demand_factor
                if random.random() < ride_chance:
                    bike['status'] = 'in-use'
            elif bike['status'] == 'maintenance':
                if random.random() < 0.03:
                    bike['status'] = 'idle'
                    bike['battery_level'] = 100

    # Alerts from station state
    alerts = []
    for st in stations_mock:
        ratio = st['current_bikes'] / st['capacity'] if st['capacity'] > 0 else 0
        if ratio < 0.10:
            alerts.append({"type": "critical", "message": f"🚨 Critical: {st['name']} nearly empty ({st['current_bikes']}/{st['capacity']})"})
        elif ratio < 0.20:
            alerts.append({"type": "warning",  "message": f"⚠️ Low stock at {st['name']} ({st['current_bikes']}/{st['capacity']})"})
        elif ratio > 0.95:
            alerts.append({"type": "info",     "message": f"📦 {st['name']} nearly full ({st['current_bikes']}/{st['capacity']})"})

    active_alert = random.choice(alerts)['message'] if alerts else None

    # Revenue (scaled by real weather/demand)
    rides_this_tick = max(1, int(random.randint(2, 8) * demand_factor))
    ride_revenue = rides_this_tick * random.uniform(2.5, 5.0)
    revenue_today += ride_revenue

    # Demand predictions for next 3 hours using UCI patterns
    hour = datetime.datetime.now().hour
    from_hourly = [47, 34, 24, 14, 5, 23, 87, 283, 463, 263, 178, 221,
                   285, 270, 255, 249, 298, 451, 397, 283, 205, 171, 126, 80]
    predictions = {}
    for offset, key in [(1, "1_hour"), (2, "2_hour"), (3, "3_hour")]:
        h = (hour + offset) % 24
        base = from_hourly[h]
        predictions[key] = max(5, int(base * demand_factor))

    payload = {
        "stations":    stations_mock,
        "bikes":       bikes_mock,
        "alert":       active_alert,
        "revenue": {
            "daily":       round(revenue_today, 2),
            "hourly_rate": round(ride_revenue * 12, 2),
            "rides_count": rides_this_tick,
        },
        "predictions": predictions,
        "weather": {
            "type":     weather.get("type"),
            "label":    weather.get("label"),
            "icon":     weather.get("icon"),
            "temp":     weather.get("temp"),
            "humidity": weather.get("humidity"),
        },
    }

    try:
        requests.post(BACKEND_URL, json=payload, timeout=3)
        active_rides = sum(1 for b in bikes_mock if b['status'] == 'in-use')
        print(
            f"[Tick {tick}] {weather['icon']} {weather['label']} {weather['temp']}°C | "
            f"Demand×{demand_factor:.2f} | Rides: {active_rides} | "
            f"Revenue: ₹{revenue_today:.0f} | Alert: {active_alert or 'None'}"
        )
    except Exception as e:
        print(f"[Tick {tick}] Backend unreachable: {e}")


if __name__ == "__main__":
    print("\n🔄 VeloAI Simulation starting (Bangalore · live weather)...")
    print(f"   Backend: {BACKEND_URL}")
    print(f"   Weather: OpenMeteo API (real Bangalore data)")
    print(f"   Interval: 5 seconds\n")

    while True:
        weather = fetch_bangalore_weather()
        simulate_step(weather)
        time.sleep(5)
