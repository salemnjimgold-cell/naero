import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/api';
import { supabaseAuthStorage } from './secureAuthStorage';

let supabaseInstance = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Supabase] URL or Anon Key not configured. Auth and realtime will be unavailable.');
      return null;
    }
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        storage: supabaseAuthStorage,
        detectSessionInUrl: false,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function destroySupabaseClient() {
  if (supabaseInstance) {
    supabaseInstance.realtime?.removeAllChannels();
    supabaseInstance = null;
  }
}
