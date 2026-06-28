import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { getAuthToken } from './authService';

const PROFILE_KEY = '@naero_user_profile';

export async function getLocalProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveLocalProfile(profile) {
  const nextProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
  return nextProfile;
}

export async function getRemoteProfile() {
  const token = await getAuthToken();
  if (!token) {
    return { data: null, error: { code: 'AUTH_REQUIRED', message: 'No remote auth token is available.' }, status: 401 };
  }
  return apiClient.get('/v1/profile', { authToken: token });
}

export async function syncProfile(profile) {
  const saved = await saveLocalProfile(profile);
  const token = await getAuthToken();
  if (!token) {
    return { data: saved, error: null, remote: { skipped: true, reason: 'AUTH_REQUIRED' } };
  }
  const remote = await apiClient.put('/v1/profile', saved, { authToken: token });
  return { data: remote.data || saved, error: remote.error, remote };
}
