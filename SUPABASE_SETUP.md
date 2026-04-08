# Supabase Configuration Guidelines

## Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Under "Project Settings" > "API", note down your:
   - **Project URL**
   - **anon/public API key**
   - **service_role secret key** (Required for the backend to bypass RLS)

## Step 2: Configure Authentication
1. Go to "Authentication" > "Providers".
2. Ensure "Email" is enabled.
3. Turn off "Confirm email" if you want easy signups for testing without having to mock email verification.

## Step 3: Run the SQL Schema
1. Go to the "SQL Editor" in your Supabase dashboard.
2. Copy the contents of `supabase_schema.sql` (found in this folder) and paste it into the SQL Editor.
3. Run the query to create tables for `stations`, `bikes`, `rides`, and `revenue`.

## Step 4: Add Environment Variables
Add the credentials to your frontend and backend environments. 

### Frontend `.env`
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

### Backend `.env`
```
PORT=5000
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
ML_SERVICE_URL=http://localhost:8000
```
