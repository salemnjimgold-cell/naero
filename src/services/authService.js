import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from './supabase';
import { naeroApi } from './api/naeroApi';

const AUTH_SESSION_KEY = '@naero_auth_session';

function serializeSession(supabaseSession) {
  if (!supabaseSession) return null;
  return {
    mode: 'authenticated',
    provider: 'supabase',
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    user: supabaseSession.user ? {
      id: supabaseSession.user.id,
      email: supabaseSession.user.email,
      displayName: supabaseSession.user.user_metadata?.full_name || supabaseSession.user.email?.split('@')[0] || 'User',
      isAnonymous: false,
    } : null,
    expiresAt: supabaseSession.expires_at ? new Date(supabaseSession.expires_at * 1000).toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function serializeGuestSession() {
  return {
    mode: 'guest',
    provider: 'guest',
    accessToken: null,
    refreshToken: null,
    user: {
      id: 'guest',
      uid: 'guest',
      email: null,
      displayName: 'Guest',
      isAnonymous: true,
    },
    expiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getAuthSession() {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const serialized = serializeSession(session);
        await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(serialized));
        naeroApi.setToken(session.access_token);
        return serialized;
      }
    }
    const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function signInAsGuest() {
  const session = serializeGuestSession();
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  naeroApi.clearToken();
  return { session, user: session.user, error: null };
}

export async function signInWithEmail(email, password) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { user: null, session: null, error: 'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, session: null, error: error.message };
    const session = serializeSession(data.session);
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    naeroApi.setToken(data.session.access_token);
    return { user: session.user, session, error: null };
  } catch (err) {
    return { user: null, session: null, error: err.message };
  }
}

export async function createAccount(email, password, displayName) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { user: null, session: null, error: 'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
      },
    });
    if (error) return { user: null, session: null, error: error.message };
    const session = data.session ? serializeSession(data.session) : null;
    if (session) {
      await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      naeroApi.setToken(data.session.access_token);
    }
    return { user: data.user, session, error: null };
  } catch (err) {
    return { user: null, session: null, error: err.message };
  }
}

export async function requestPasswordReset(email) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase is not configured.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'naeroapp://auth/callback',
    });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function signOut() {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch {}
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  naeroApi.clearToken();
  return { success: true };
}

export async function getAuthToken() {
  const session = await getAuthSession();
  return session?.accessToken || null;
}

export async function isAuthenticated() {
  const session = await getAuthSession();
  return session?.mode === 'authenticated';
}

export async function onAuthStateChange(callback) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    callback('GUEST');
    return () => {};
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    callback(event);
  });
  return () => subscription?.unsubscribe();
}

export async function updateProfile(updates) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not configured.' };
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    if (error) return { data: null, error: error.message };
    return { data: data.user, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
