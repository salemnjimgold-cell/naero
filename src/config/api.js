export const API_BASE_URL = process.env.EXPO_PUBLIC_NAERO_API_URL || '';
export const API_TIMEOUT_MS = 10000;

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export function isRemoteApiEnabled(baseUrl = API_BASE_URL) {
  return Boolean(baseUrl && /^https?:\/\//i.test(baseUrl));
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
