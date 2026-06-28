import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_SESSION_KEY = '@naero_auth_session';

function createGuestSession() {
  const now = new Date().toISOString();
  return {
    mode: 'guest',
    token: null,
    user: {
      id: 'guest',
      uid: 'guest',
      isAnonymous: true,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function getAuthSession() {
  try {
    const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function signInAsGuest() {
  const session = createGuestSession();
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return { session, user: session.user, error: null };
}

export async function getAuthToken() {
  const session = await getAuthSession();
  return session?.token || null;
}

export async function isAuthenticated() {
  const session = await getAuthSession();
  return Boolean(session?.user);
}

export async function signOut() {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  return { success: true };
}

export async function signInWithEmail() {
  return {
    user: null,
    session: null,
    error: 'Supabase auth is planned but not configured in the mobile client yet.',
  };
}

export async function createAccount() {
  return {
    user: null,
    session: null,
    error: 'Supabase auth is planned but not configured in the mobile client yet.',
  };
}
