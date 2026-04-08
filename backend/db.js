const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock-url.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'mock-service-key';

// Use the service key to bypass Row Level Security for admin actions like aggregations
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
