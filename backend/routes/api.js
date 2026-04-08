const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { requireAuth } = require('../middleware/auth');
const { broadcastData } = require('../socket');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ─── Dataset Cache ────────────────────────────────────────────
let hourlyData = null;
let dailyData = null;

function loadDatasets() {
    try {
        const hourPath = path.join(__dirname, '../../hour.csv');
        const dayPath = path.join(__dirname, '../../day.csv');
        
        if (fs.existsSync(hourPath)) {
            const lines = fs.readFileSync(hourPath, 'utf-8').trim().split('\n');
            const headers = lines[0].replace(/\r/g, '').split(',');
            hourlyData = lines.slice(1).map(line => {
                const vals = line.replace(/\r/g, '').split(',');
                const obj = {};
                headers.forEach((h, i) => obj[h] = vals[i]);
                return obj;
            });
            console.log(`Loaded ${hourlyData.length} hourly records`);
        }
        
        if (fs.existsSync(dayPath)) {
            const lines = fs.readFileSync(dayPath, 'utf-8').trim().split('\n');
            const headers = lines[0].replace(/\r/g, '').split(',');
            dailyData = lines.slice(1).map(line => {
                const vals = line.replace(/\r/g, '').split(',');
                const obj = {};
                headers.forEach((h, i) => obj[h] = vals[i]);
                return obj;
            });
            console.log(`Loaded ${dailyData.length} daily records`);
        }
    } catch (err) {
        console.error('Failed to load datasets:', err.message);
    }
}

loadDatasets();

// ─── Stations ──────────────────────────────────────────────────
router.get('/stations', async (req, res) => {
    try {
        // Try Supabase first, fallback to mock data
        const { data, error } = await supabase.from('stations').select('*').order('id', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        // Fallback mock stations
        res.json([
            { id: 1, name: "Indiranagar", lat: 12.9784, lng: 77.6408, capacity: 50, current_bikes: 25 },
            { id: 2, name: "Koramangala", lat: 12.9279, lng: 77.6271, capacity: 40, current_bikes: 35 },
            { id: 3, name: "MG Road", lat: 12.9719, lng: 77.6013, capacity: 30, current_bikes: 5 },
            { id: 4, name: "Whitefield", lat: 12.9698, lng: 77.7499, capacity: 35, current_bikes: 30 },
            { id: 5, name: "HSR Layout", lat: 12.9121, lng: 77.6446, capacity: 60, current_bikes: 58 },
            { id: 6, name: "Jayanagar", lat: 12.9299, lng: 77.5824, capacity: 45, current_bikes: 20 },
            { id: 7, name: "Malleshwaram", lat: 13.0031, lng: 77.5643, capacity: 35, current_bikes: 28 },
            { id: 8, name: "Electronic City", lat: 12.8452, lng: 77.6602, capacity: 25, current_bikes: 12 },
        ]);
    }
});

// ─── Bikes ─────────────────────────────────────────────────────
router.get('/bikes', async (req, res) => {
    try {
        const { data, error } = await supabase.from('bikes').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        // Generate mock bikes based on stations
        const mockBikes = [];
        const stations = [
            { id: 1, name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
            { id: 2, name: "Koramangala", lat: 12.9279, lng: 77.6271 },
            { id: 3, name: "MG Road", lat: 12.9719, lng: 77.6013 },
            { id: 4, name: "Whitefield", lat: 12.9698, lng: 77.7499 },
            { id: 5, name: "HSR Layout", lat: 12.9121, lng: 77.6446 },
        ];
        let bikeId = 1;
        stations.forEach(st => {
            for (let i = 0; i < 8; i++) {
                const statuses = ['idle', 'idle', 'idle', 'in-use', 'in-use', 'maintenance'];
                mockBikes.push({
                    id: bikeId++,
                    station_id: st.id,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    battery_level: Math.floor(Math.random() * 60) + 40,
                    lat: st.lat + (Math.random() - 0.5) * 0.008,
                    lng: st.lng + (Math.random() - 0.5) * 0.008,
                });
            }
        });
        res.json(mockBikes);
    }
});

// ─── Revenue ───────────────────────────────────────────────────
router.get('/revenue', async (req, res) => {
    try {
        const { data, error } = await supabase.from('revenue').select('*').order('date', { ascending: false }).limit(30);
        if (error) throw error;
        res.json(data);
    } catch (err) {
        // Generate mock revenue data from dataset
        const mockRevenue = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            mockRevenue.push({
                date: d.toISOString().split('T')[0],
                amount: Math.round(1500 + Math.random() * 3500),
                rides: Math.floor(200 + Math.random() * 600),
            });
        }
        res.json(mockRevenue);
    }
});

// ─── Dataset Stats (hourly aggregated) ─────────────────────────
router.get('/dataset/stats', (req, res) => {
    if (!hourlyData) return res.json({ error: 'Dataset not loaded' });
    
    // Aggregate by hour of day
    const hourlyAvg = {};
    for (let h = 0; h < 24; h++) hourlyAvg[h] = { total: 0, count: 0, casual: 0, registered: 0 };
    
    hourlyData.forEach(row => {
        const hr = parseInt(row.hr);
        const cnt = parseInt(row.cnt) || 0;
        if (hourlyAvg[hr] !== undefined) {
            hourlyAvg[hr].total += cnt;
            hourlyAvg[hr].casual += parseInt(row.casual) || 0;
            hourlyAvg[hr].registered += parseInt(row.registered) || 0;
            hourlyAvg[hr].count++;
        }
    });
    
    const hourlyPattern = Object.entries(hourlyAvg).map(([hr, v]) => ({
        hour: parseInt(hr),
        avgDemand: Math.round(v.total / (v.count || 1)),
        avgCasual: Math.round(v.casual / (v.count || 1)),
        avgRegistered: Math.round(v.registered / (v.count || 1)),
    }));
    
    // Aggregate by season
    const seasonNames = { '1': 'Spring', '2': 'Summer', '3': 'Fall', '4': 'Winter' };
    const seasonAgg = {};
    hourlyData.forEach(row => {
        const s = row.season;
        if (!seasonAgg[s]) seasonAgg[s] = { total: 0, count: 0 };
        seasonAgg[s].total += parseInt(row.cnt) || 0;
        seasonAgg[s].count++;
    });
    
    const seasonalPattern = Object.entries(seasonAgg).map(([s, v]) => ({
        season: seasonNames[s] || s,
        avgDemand: Math.round(v.total / (v.count || 1)),
    }));
    
    // Weather impact
    const weatherNames = { '1': 'Clear', '2': 'Cloudy', '3': 'Light Rain', '4': 'Heavy Rain' };
    const weatherAgg = {};
    hourlyData.forEach(row => {
        const w = row.weathersit;
        if (!weatherAgg[w]) weatherAgg[w] = { total: 0, count: 0 };
        weatherAgg[w].total += parseInt(row.cnt) || 0;
        weatherAgg[w].count++;
    });
    
    const weatherImpact = Object.entries(weatherAgg).map(([w, v]) => ({
        weather: weatherNames[w] || w,
        avgDemand: Math.round(v.total / (v.count || 1)),
    }));
    
    // Monthly trend
    const monthlyAgg = {};
    if (dailyData) {
        dailyData.forEach(row => {
            const key = `${row.yr === '0' ? '2011' : '2012'}-${row.mnth.padStart(2, '0')}`;
            if (!monthlyAgg[key]) monthlyAgg[key] = { total: 0, count: 0 };
            monthlyAgg[key].total += parseInt(row.cnt) || 0;
            monthlyAgg[key].count++;
        });
    }
    
    const monthlyTrend = Object.entries(monthlyAgg)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({
            month,
            totalDemand: v.total,
            avgDaily: Math.round(v.total / (v.count || 1)),
        }));
    
    // Recent hourly counts for prediction input
    const recentHours = hourlyData.slice(-72).map(r => parseInt(r.cnt) || 0);
    
    res.json({
        totalRecords: hourlyData.length,
        hourlyPattern,
        seasonalPattern,
        weatherImpact,
        monthlyTrend,
        recentHours,
    });
});

// ─── Predict Demand (Proxy to ML) ──────────────────────────────
router.post('/predict', async (req, res) => {
    try {
        const history = req.body.history || (hourlyData ? hourlyData.slice(-24).map(r => parseInt(r.cnt) || 0) : []);
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, { history });
        res.json(mlResponse.data);
    } catch (err) {
        // Fallback: simple moving average
        const history = hourlyData ? hourlyData.slice(-24).map(r => parseInt(r.cnt) || 0) : [100, 120, 150];
        const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
        res.json({ forecast: [avg, avg + 10, avg + 5] });
    }
});

// ─── Rebalancing (Proxy to ML) ─────────────────────────────────
router.post('/rebalance', async (req, res) => {
    try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/rebalance`, { stations: req.body.stations });
        res.json(mlResponse.data);
    } catch (err) {
        res.json({ recommendations: [{ action: "ML service unavailable. Manual review needed.", source_id: null, target_id: null, amount: 0 }] });
    }
});

// ─── Dynamic Pricing (Proxy to ML) ─────────────────────────────
router.post('/pricing', async (req, res) => {
    try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/pricing/dynamic`, { stations: req.body.stations });
        res.json(mlResponse.data);
    } catch (err) {
        res.json({ pricing: [] });
    }
});

// ─── Simulation Update (from simulation.py) ────────────────────
router.post('/simulate/update', async (req, res) => {
    try {
        const { stations, alert, revenue, predictions, weather, bikes } = req.body;
        broadcastData('system_update', { stations, alert, revenue, weather, bikes });
        if (predictions) {
            broadcastData('demand_prediction', predictions);
        }
        if (alert) {
            broadcastData('alert', { message: alert, timestamp: new Date().toISOString(), type: 'warning' });
        }
        res.json({ message: 'Broadcast successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Time Series Data ──────────────────────────────────────────
router.get('/data/timeseries', (req, res) => {
    if (!dailyData) return res.status(503).json({ success: false, error: 'Dataset not loaded' });

    const data = dailyData.map(row => ({
        date: row.dteday,
        value: parseInt(row.cnt) || 0,
        casual: parseInt(row.casual) || 0,
        registered: parseInt(row.registered) || 0,
    }));

    res.json({ success: true, data });
});

// ─── Naive Forecast ────────────────────────────────────────────
router.get('/forecast/naive', (req, res) => {
    if (!dailyData) return res.status(503).json({ success: false, error: 'Dataset not loaded' });

    const days = Math.min(parseInt(req.query.days) || 30, 60);
    const lastVal = parseInt(dailyData[dailyData.length - 1]?.cnt) || 0;
    const lastDate = dailyData[dailyData.length - 1]?.dteday || '';

    // Build historical actuals (last 60 days) + naive forecast
    const actual = dailyData.slice(-60).map(row => ({
        date: row.dteday,
        actual: parseInt(row.cnt) || 0,
    }));

    const forecast = [];
    const baseDate = new Date(lastDate);
    for (let i = 1; i <= days; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        forecast.push({
            date: d.toISOString().split('T')[0],
            forecast: lastVal,
        });
    }

    res.json({ success: true, model: 'naive', lastValue: lastVal, actual, forecast });
});

// ─── Moving Average Forecast ───────────────────────────────────
router.get('/forecast/moving-average', (req, res) => {
    if (!dailyData) return res.status(503).json({ success: false, error: 'Dataset not loaded' });

    const window = Math.min(parseInt(req.query.window) || 7, 30);
    const days = Math.min(parseInt(req.query.days) || 30, 60);

    const counts = dailyData.map(r => parseInt(r.cnt) || 0);

    // Build historical with MA overlay (last 60 points)
    const actual = dailyData.slice(-60).map((row, i, arr) => {
        const startIdx = Math.max(0, i - window + 1);
        const slice = arr.slice(startIdx, i + 1).map(r => parseInt(r.cnt) || 0);
        const ma = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        return {
            date: row.dteday,
            actual: parseInt(row.cnt) || 0,
            movingAvg: ma,
        };
    });

    // Forecast future: iteratively predict using last window values
    const lastDate = dailyData[dailyData.length - 1]?.dteday || '';
    const baseDate = new Date(lastDate);
    const history = [...counts];
    const forecast = [];

    for (let i = 1; i <= days; i++) {
        const slice = history.slice(-window);
        const nextVal = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        history.push(nextVal);
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        forecast.push({
            date: d.toISOString().split('T')[0],
            forecast: nextVal,
        });
    }

    res.json({ success: true, model: 'moving_average', window, actual, forecast });
});

// ─── AI Chat Assistant ─────────────────────────────────────────
router.post('/ai/chat', async (req, res) => {
    try {
        const { query } = req.body;
        // Get station context (try Supabase, fallback to mock)
        let stations;
        try {
            const { data } = await supabase.from('stations').select('id, name, current_bikes, capacity');
            stations = data;
        } catch {
            stations = [
                { id: 1, name: "Indiranagar", current_bikes: 25, capacity: 50 },
                { id: 2, name: "Koramangala", current_bikes: 35, capacity: 40 },
                { id: 3, name: "MG Road", current_bikes: 5, capacity: 30 },
                { id: 4, name: "Whitefield", current_bikes: 30, capacity: 35 },
                { id: 5, name: "HSR Layout", current_bikes: 58, capacity: 60 },
            ];
        }

        const mlResponse = await axios.post(`${ML_SERVICE_URL}/ai/ask`, { query, context: stations });
        res.json({ answer: mlResponse.data.answer });
    } catch (err) {
        const fallback = "I can help with fleet operations! Ask me about rebalancing, pricing, or demand trends. For example: 'Where should I move bikes?' or 'What stations have high demand?'";
        res.json({ answer: err.response?.data?.error || fallback });
    }
});

module.exports = router;
