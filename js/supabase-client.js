// /js/supabase-client.js

// Replace these with your actual Supabase project credentials.
const SUPABASE_URL = 'https://wnvioeabsiizpbldwcek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudmlvZWFic2lpenBibGR3Y2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMzYwNzEsImV4cCI6MjEwMjYxMjA3MX0.c9rV5m0YdyzuXIhK7-P6tDwPqyIHqMkiJXZBZ9bS1KQ';

// Initialize the Supabase client for the Public Portal
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storageKey: 'shlok-public-auth-token'
    }
});
