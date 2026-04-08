# Bike Rental Optimization Platform 🚲🤖

A production-ready, real-time AI-powered web application for optimizing bike rental fleets.

## Components
1. **Frontend**: React (Vite) + Recharts + WebSockets + Supabase Auth.
2. **Backend**: Node.js + Express + Socket.IO + Supabase verification.
3. **ML Layer**: Python (Flask) with simple algorithms for demand prediction and rebalancing.
4. **Simulator**: Python script faking live gps traces and data updates.

---

## 🚀 Quick Start (Local Setup)

I've provided a bash script to start the whole suite together!

```bash
chmod +x start_all.sh
./start_all.sh
```

**What this does:**
1. Starts the Python ML Service on `http://localhost:8000`
2. Starts the Simulation background script generating real-time payloads.
3. Starts the Node.js API + WebSockets on `http://localhost:5000`
4. Starts the Vite Frontend on `http://localhost:5173`

---

## 🔐 Database & Supabase Instructions

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com/) and click \"New Project\".
2. Add a strong password for your database.
3. Navigate to **Project Settings -> API** to get your keys.

### 2. Set Up the Schema
1. Open the Supabase **SQL Editor**.
2. Run the `supabase_schema.sql` file provided into an editor tab and hit Run to create `stations`, `bikes`, `rides`, and `revenue`.

### 3. Setup Environment Variables
To link the project to Supabase, create `.env` files in `frontend` and `backend`.

**`frontend/.env`**
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
VITE_API_URL=http://localhost:5000
```

**`backend/.env`**
```env
PORT=5000
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=YOUR_JWT_SECRET_FROM_SUPABASE_SETTINGS
ML_SERVICE_URL=http://localhost:8000
```

*(Note: The codebase contains logic that bypasses strict checks if env variables are not found for easy local demo viewing, but ensure they are set for production functionality!)*

## 🧩 Features
* **Live Dashboards:** See real-time node pings for bike spots matching physical capabilities.
* **AI Chat:** An integrated chatbot capable of helping suggest dynamic price structures based on volume constraints logic.
* **Socket Events:** Completely event-driven UI updates smoothly in response to real-time events.
