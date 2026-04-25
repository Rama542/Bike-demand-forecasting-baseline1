// Vercel Serverless Function: /api/chat
// Powers the VeloAI chatbot using Google Gemini API

module.exports = async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Missing query' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    // No API key → return smart context-aware mock response
    return res.status(200).json({ answer: getMockResponse(query), source: 'mock' });
  }

  try {
    const systemPrompt = `You are VeloAI, an intelligent assistant for a bike-sharing fleet management platform in Bangalore, India.
You help operators make real-time decisions about:
- Fleet rebalancing (moving bikes between stations)
- Dynamic pricing recommendations
- Demand forecasting using ML models
- Station utilization and alerts

Current fleet context:
- 8 stations across Bangalore: MG Road, Koramangala, Indiranagar, HSR Layout, Whitefield, Electronic City, Jayanagar, Hebbal
- 120 total bikes, ~312 rides today, ₹4,850 daily revenue
- Peak hours: 8AM-10AM and 5PM-8PM
- Low stock: MG Road (8/30), Electronic City (4/25)
- Near full: HSR Layout (58/60), Indiranagar (35/40)
- Weather: 22°C, Clear Sky

Respond concisely (3-5 sentences max). Be specific with station names and numbers. Sound like an AI fleet intelligence system.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\nUser query: ' + query }] }
          ],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
    return res.status(200).json({ answer, source: 'gemini' });

  } catch (err) {
    console.error('Gemini API error:', err.message);
    // Fallback to smart mock instead of showing error
    return res.status(200).json({ answer: getMockResponse(query), source: 'mock' });
  }
}

// Smart context-aware fallback responses
function getMockResponse(query) {
  const q = query.toLowerCase();

  if (q.includes('rebalanc') || q.includes('move') || q.includes('where')) {
    return '🔄 **Rebalancing Recommended:** Move 8 bikes from HSR Layout (58/60) to MG Road (8/30) immediately — high priority. Additionally, transfer 4 bikes from Indiranagar to Electronic City (4/25) to prevent stock-out. Expected demand at Electronic City increases 40% after 5PM.';
  }
  if (q.includes('pric') || q.includes('surge') || q.includes('rev')) {
    return '💰 **Pricing Intelligence:** Apply 1.4x surge at MG Road (low supply, high demand zone). Reduce pricing to ₹12/ride at Electronic City to incentivize usage. Current daily revenue is ₹4,850 with 312 rides. Optimized pricing could increase revenue by ~18%.';
  }
  if (q.includes('demand') || q.includes('forecast') || q.includes('predict')) {
    return '📈 **Demand Forecast:** Peak demand expected at 5PM-8PM today with ~530 rides/hour across all stations. Koramangala and Indiranagar will hit 85% capacity. ML model (ARIMA + XGBoost) predicts 4,200 total trips today based on weather (clear, 22°C) and it being a weekday.';
  }
  if (q.includes('station') || q.includes('busiest') || q.includes('popular')) {
    return '🗺️ **Station Intelligence:** Indiranagar is the busiest station (35/40 bikes checked out today). MG Road has critically low inventory (8/30). Koramangala shows balanced flow with 22 active bikes. HSR Layout is near-full and needs 6 bikes redistributed to other zones.';
  }
  if (q.includes('weather') || q.includes('rain') || q.includes('temperature')) {
    return '☀️ **Weather Impact Analysis:** Current conditions (22°C, Clear Sky) are optimal for bike usage — expect +15% above baseline demand. Rain events reduce demand by 35-60%. Wind speeds above 25km/h reduce ridership by ~20%. Today\'s forecast is favorable for maximum fleet utilization.';
  }
  if (q.includes('revenue') || q.includes('money') || q.includes('earn')) {
    return '💵 **Revenue Report:** ₹4,850 generated today from 312 rides (avg ₹15.5/ride). Hourly rate is ₹202. Peak revenue hour was 8AM-9AM (₹380). Weekly trend shows +12% growth. Projected monthly revenue at current rate: ₹1.45 Lakh.';
  }
  return '🤖 **VeloAI Analysis:** Based on current fleet data, I recommend prioritizing MG Road restocking (critically low at 8/30 bikes) and reviewing Electronic City pricing strategy. Overall fleet health is at 72% efficiency. Would you like specific recommendations for rebalancing, pricing, or demand forecasting?';
}
