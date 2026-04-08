import time
import requests
import random
import math

BACKEND_URL = "http://localhost:5000/api/simulate/update"

# Realistic station data with NYC coordinates
stations_mock = [
    {"id": 1, "name": "Central Park", "lat": 40.785091, "lng": -73.968285, "capacity": 50, "current_bikes": 25},
    {"id": 2, "name": "Times Square", "lat": 40.758896, "lng": -73.985130, "capacity": 40, "current_bikes": 35},
    {"id": 3, "name": "Brooklyn Bridge", "lat": 40.706086, "lng": -73.996864, "capacity": 30, "current_bikes": 5},
    {"id": 4, "name": "Wall Street", "lat": 40.707491, "lng": -74.011276, "capacity": 35, "current_bikes": 30},
    {"id": 5, "name": "Grand Central", "lat": 40.752726, "lng": -73.977229, "capacity": 60, "current_bikes": 58},
    {"id": 6, "name": "Union Square", "lat": 40.735863, "lng": -73.991084, "capacity": 45, "current_bikes": 20},
    {"id": 7, "name": "Chelsea Market", "lat": 40.742440, "lng": -74.006020, "capacity": 35, "current_bikes": 28},
    {"id": 8, "name": "Soho", "lat": 40.723301, "lng": -74.002988, "capacity": 25, "current_bikes": 12},
]

# Simulated bikes with GPS
bikes_mock = []
bike_id = 1
for st in stations_mock:
    for i in range(st['capacity'] // 5):
        status_choices = ['idle', 'idle', 'idle', 'in-use', 'in-use', 'maintenance']
        bikes_mock.append({
            'id': bike_id,
            'station_id': st['id'],
            'status': random.choice(status_choices),
            'battery_level': random.randint(20, 100),
            'lat': st['lat'] + random.uniform(-0.004, 0.004),
            'lng': st['lng'] + random.uniform(-0.004, 0.004),
        })
        bike_id += 1

# Weather states
weather_conditions = [
    {"type": "clear", "label": "Clear Sky", "temp": 22, "humidity": 45, "icon": "☀️"},
    {"type": "cloudy", "label": "Partly Cloudy", "temp": 18, "humidity": 60, "icon": "⛅"},
    {"type": "rain", "label": "Light Rain", "temp": 15, "humidity": 80, "icon": "🌧️"},
    {"type": "clear", "label": "Sunny", "temp": 25, "humidity": 40, "icon": "🌤️"},
]

tick = 0
revenue_today = 0

def get_demand_factor():
    """Simulate time-based demand patterns (peak hours have higher demand)."""
    import datetime
    hour = datetime.datetime.now().hour
    
    # Morning rush: 7-9, Evening rush: 17-19
    if 7 <= hour <= 9:
        return 1.5
    elif 17 <= hour <= 19:
        return 1.8
    elif 10 <= hour <= 16:
        return 1.2
    elif 20 <= hour <= 22:
        return 0.8
    else:
        return 0.4


def simulate_step():
    global tick, revenue_today
    tick += 1
    
    demand_factor = get_demand_factor()
    
    # Update station bikes with demand-aware changes
    for st in stations_mock:
        # Higher capacity stations have more variance
        max_change = max(1, int(st['capacity'] * 0.08 * demand_factor))
        change = random.randint(-max_change, max_change)
        
        # Bias: during peak, bikes get taken more (decrease)
        if demand_factor > 1.3:
            change -= random.randint(0, 2)
        
        st['current_bikes'] = max(0, min(st['capacity'], st['current_bikes'] + change))

    # Update bike positions (simulate movement)
    for bike in bikes_mock:
        station = next((s for s in stations_mock if s['id'] == bike['station_id']), None)
        if station:
            if bike['status'] == 'in-use':
                # Move bike slightly
                bike['lat'] += random.uniform(-0.001, 0.001)
                bike['lng'] += random.uniform(-0.001, 0.001)
                bike['battery_level'] = max(0, bike['battery_level'] - random.randint(0, 2))
                
                # Chance to complete ride
                if random.random() < 0.15:
                    bike['status'] = 'idle'
                    new_station = random.choice(stations_mock)
                    bike['station_id'] = new_station['id']
                    bike['lat'] = new_station['lat'] + random.uniform(-0.002, 0.002)
                    bike['lng'] = new_station['lng'] + random.uniform(-0.002, 0.002)
            elif bike['status'] == 'idle':
                # Chance to start ride (higher during peak)
                ride_chance = 0.05 * demand_factor
                if random.random() < ride_chance:
                    bike['status'] = 'in-use'
            elif bike['status'] == 'maintenance':
                # Chance to return to service
                if random.random() < 0.03:
                    bike['status'] = 'idle'
                    bike['battery_level'] = 100

    # Generate alerts
    alerts = []
    for st in stations_mock:
        ratio = st['current_bikes'] / st['capacity'] if st['capacity'] > 0 else 0
        if ratio < 0.1:
            alerts.append({"type": "critical", "message": f"🚨 Critical: {st['name']} nearly empty ({st['current_bikes']}/{st['capacity']})"})
        elif ratio < 0.2:
            alerts.append({"type": "warning", "message": f"⚠️ Low inventory at {st['name']} ({st['current_bikes']}/{st['capacity']})"})
        elif ratio > 0.95:
            alerts.append({"type": "info", "message": f"📦 {st['name']} nearly full ({st['current_bikes']}/{st['capacity']})"})
    
    active_alert = random.choice(alerts)['message'] if alerts else None
    
    # Revenue simulation
    rides_this_tick = random.randint(2, 8) * int(demand_factor)
    ride_revenue = rides_this_tick * random.uniform(2.5, 5.0)
    revenue_today += ride_revenue

    # Weather (changes occasionally)
    weather = weather_conditions[tick % len(weather_conditions)] if tick % 20 == 0 else weather_conditions[0]

    payload = {
        "stations": stations_mock,
        "bikes": bikes_mock,
        "alert": active_alert,
        "revenue": {
            "daily": round(revenue_today, 2),
            "hourly_rate": round(ride_revenue * 12, 2),  # Approximate hourly
            "rides_count": rides_this_tick,
        },
        "predictions": {
            "1_hour": int(random.gauss(150, 30) * demand_factor),
            "2_hour": int(random.gauss(180, 35) * demand_factor),
            "3_hour": int(random.gauss(140, 25) * demand_factor),
        },
        "weather": weather,
    }

    try:
        requests.post(BACKEND_URL, json=payload, timeout=3)
        active_rides = sum(1 for b in bikes_mock if b['status'] == 'in-use')
        print(f"[Tick {tick}] Bikes active: {active_rides} | Revenue: ${revenue_today:.0f} | Alert: {active_alert or 'None'}")
    except Exception as e:
        print(f"[Tick {tick}] Failed to reach backend: {e}")


if __name__ == "__main__":
    print("\n🔄 VeloAI Simulation starting...")
    print("   Sending updates to:", BACKEND_URL)
    print("   Interval: every 5 seconds\n")
    while True:
        simulate_step()
        time.sleep(5)
