import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://euwbsvjpxcwznrhdsfjx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1d2JzdmpweGN3em5yaGRzZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTAwNjQsImV4cCI6MjA4MTcyNjA2NH0.FMxON2wCdnBXEb1KU9YCV6QYMy8T41KRGVajKMfpUVg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
  },
});