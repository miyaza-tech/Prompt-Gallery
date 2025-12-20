// Supabase Configuration
const SUPABASE_URL = 'https://uhwnbjmfcakbkbxvhpgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVod25iam1mY2FrYmtieHZocGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDcyNjQsImV4cCI6MjA3NzU4MzI2NH0.zLruWi1KvK0BKSZX3AdiY6kdBXMh_mTcT-Mzwq2mc5k';

// Wait for Supabase SDK to load
if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase SDK not available!');
    throw new Error('Supabase SDK failed to load');
}

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase client initialized:', supabase);
