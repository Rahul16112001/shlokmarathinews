// /admin/js/admin-supabase.js

// Replace these with your actual Supabase project credentials.
// For a production app without a build step, consider loading these via a config file that is gitignored.
const SUPABASE_URL = 'https://wnvioeabsiizpbldwcek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudmlvZWFic2lpenBibGR3Y2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMzYwNzEsImV4cCI6MjEwMjYxMjA3MX0.c9rV5m0YdyzuXIhK7-P6tDwPqyIHqMkiJXZBZ9bS1KQ';

// Initialize the Supabase client for the Admin Panel
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
