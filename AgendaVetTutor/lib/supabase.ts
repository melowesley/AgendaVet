import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cahlaalebcwqgbbavrsf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhaGxhYWxlYmN3cWdiYmF2cnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTk2OTIsImV4cCI6MjA4Njg3NTY5Mn0.LkKMoexNfjdMF35DMpwMjvXtMwNg_5WRdKSoPEv29qE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
