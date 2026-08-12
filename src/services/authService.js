import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from './supabase';
import { naeroApi } from './api/naeroApi';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Linking } from 'react-native';
import { syncProfile } from './profileService';

const AUTH_SESSION_KEY = '@naero_auth_session';
const OAUTH_REDIRECT = makeRedirectUri({ scheme: 'naeroapp', path: 'auth/callback' });

function serializeSession(supabaseSession) {
  if (!supabaseSession) return null;
  return {
    mode: 'authenticated',
    provider: 'supabase',
    accessToken: supabaseSession.access_token,
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
        await AsyncStorage.removeItem(AUTH_SESSION_KEY);
        naeroApi.setToken(session.access_token);
        return serialized;
      }
    }
    const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (stored?.mode !== 'guest') {
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    return stored;
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
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
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
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);
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

function parseUrlParams(urlString) {
  const params = {};
  const qIdx = urlString.indexOf('?');
  const hIdx = urlString.indexOf('#');
  if (qIdx !== -1) {
    const end = hIdx !== -1 ? hIdx : urlString.length;
    urlString.slice(qIdx + 1, end).split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
    });
  }
  if (hIdx !== -1) {
    urlString.slice(hIdx + 1).split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
    });
  }
  return params;
}

export async function saveOAuthSession(supabaseSession, provider) {
  const session = serializeSession(supabaseSession);
  session.provider = provider;
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  naeroApi.setToken(supabaseSession.access_token);

  try {
    const meta = supabaseSession.user?.user_metadata || {};
    await syncProfile({
      id: supabaseSession.user?.id,
      email: supabaseSession.user?.email || meta.email || '',
      displayName: meta.full_name || meta.name || supabaseSession.user?.email?.split('@')[0] || 'User',
      avatarUrl: meta.avatar_url || meta.picture || meta.avatarUrl || '',
      provider,
    });
  } catch {
    /* profile sync is best-effort */
  }

  return { session, user: session.user, error: null };
}

export async function signInWithOAuth(provider) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { session: null, user: null, error: 'Supabase is not configured.' };
    }

    const providerScopes = {
      google: 'email',
      facebook: 'email,public_profile',
      apple: 'email',
    };

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: OAUTH_REDIRECT, scopes: providerScopes[provider] || 'email' },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not enabled') || msg.includes('unsupported') || msg.includes('not configured')) {
        return { session: null, user: null, error: 'This sign-in method is coming soon.' };
      }
      return { session: null, user: null, error: error.message };
    }

    if (!data?.url) {
      return { session: null, user: null, error: 'Could not start authentication. Try again.' };
    }

    // Set up Linking fallback BEFORE opening browser
    let linkingUrl = null;
    const linkingSub = Linking.addEventListener('url', (event) => {
      if (event.url && !linkingUrl) {
        linkingUrl = event.url;
      }
    });

    const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT);

    // Small delay for any late Linking event
    if (!result.url) {
      await new Promise(r => setTimeout(r, 2000));
    }

    linkingSub.remove();

    const callbackUrl = linkingUrl || (result.type === 'success' && result.url) || null;

    if (!callbackUrl) {
      if (result.type === 'success') {
        return { session: null, user: null, error: 'Authentication failed. No code received.' };
      }
      return { session: null, user: null, error: null };
    }

    const params = parseUrlParams(callbackUrl);

    if (params.error) {
      const msg = params.error_description || params.error;
      return { session: null, user: null, error: msg };
    }

    if (params.code) {
      const { data: sd, error: exError } = await supabase.auth.exchangeCodeForSession(params.code);
      if (exError) {
        const msg = exError.message.toLowerCase();
        if (msg.includes('not enabled') || msg.includes('unsupported') || msg.includes('not configured')) {
          return { session: null, user: null, error: 'This sign-in method is coming soon.' };
        }
        return { session: null, user: null, error: exError.message };
      }
      if (!sd?.session) return { session: null, user: null, error: 'No session returned.' };
      return await saveOAuthSession(sd.session, provider);
    }

    if (params.access_token) {
      const { data: sd, error: setError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token || '',
      });
      if (setError) {
        return { session: null, user: null, error: setError.message };
      }
      if (!sd?.session) return { session: null, user: null, error: 'No session returned.' };
      return await saveOAuthSession(sd.session, provider);
    }

    return { session: null, user: null, error: 'Authentication failed. No code received.' };
  } catch (err) {
    return { session: null, user: null, error: err.message || 'Authentication failed.' };
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
