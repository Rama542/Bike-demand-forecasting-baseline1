-- Supabase DB Schema Setup

-- 1. Stations table
CREATE TABLE public.stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    capacity INTEGER NOT NULL,
    current_bikes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bikes table
CREATE TABLE public.bikes (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES public.stations(id),
    status VARCHAR(50) NOT NULL DEFAULT 'idle', -- idle, in-use, maintenance
    battery_level INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Rides table
CREATE TABLE public.rides (
    id SERIAL PRIMARY KEY,
    bike_id INTEGER REFERENCES public.bikes(id),
    start_station INTEGER REFERENCES public.stations(id),
    end_station INTEGER REFERENCES public.stations(id),
    user_id UUID, -- References auth.users from Supabase
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_time TIMESTAMP WITH TIME ZONE,
    price DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'active' -- active, completed
);

-- 4. Revenue Aggregation
CREATE TABLE public.revenue (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We use auth.users by Supabase for actual authentication
-- Optional: if you need additional user details, you can create a profiles table tied to auth.users.

-- RLS (Row Level Security) Configuration
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read stations and bikes
CREATE POLICY "Allow public read-access for stations" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Allow public read-access for bikes" ON public.bikes FOR SELECT USING (true);

-- Allow authenticated users to insert their own rides
CREATE POLICY "Allow individuals to see their own rides" ON public.rides 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow individuals to create rides" ON public.rides 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System service role can bypass RLS for updating current bikes, revenue, etc.
