import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://cahlaalebcwqgbbavrsf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhaGxhYWxlYmN3cWdiYmF2cnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTk2OTIsImV4cCI6MjA4Njg3NTY5Mn0.LkKMoexNfjdMF35DMpwMjvXtMwNg_5WRdKSoPEv29qE';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});