// Supabase Configuration
const SUPABASE_URL = 'https://heeldonrwnjhpubphggq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZWxkb25yd25qaHB1YnBoZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTA4OTgsImV4cCI6MjA3NzM2Njg5OH0.d72Vv3GgY_iyNwPIU_XMXGjtLj4u9GJZWQemvpUBSkA';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
