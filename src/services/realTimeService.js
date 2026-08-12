import { placeService } from './placeService';
import { apiClient } from './apiClient';
import { locationCache } from './cacheService';

const REAL_TIME_ENABLED_KEY = '@naero_realtime_enabled';
const LAST_LOCATION_KEY = '@naero_realtime_last_location';

let _realtimeEnabled = true;

export function isRealtimeEnabled() {
  return _realtimeEnabled;
}

export async function setRealtimeEnabled(enabled) {
  _realtimeEnabled = enabled;
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(REAL_TIME_ENABLED_KEY, String(enabled));
  } catch {}
}

export async function loadRealtimePreference() {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const val = await AsyncStorage.getItem(REAL_TIME_ENABLED_KEY);
    if (val !== null) _realtimeEnabled = val === 'true';
  } catch {}
  return _realtimeEnabled;
}

export async function fetchLivePlacesNearby(lat, lng, radiusKm = 5, category = null) {
  if (!_realtimeEnabled) return { source: 'disabled', data: [] };
  return placeService.getNearby(lat, lng, radiusKm, 20, category || 'hospital');
}

export async function fetchLivePlacesByCity(cityName, category = null) {
  if (!_realtimeEnabled) return { source: 'disabled', data: [] };

  return { source: 'location_required', data: [], error: 'Nearby search requires resolved coordinates.' };
}

export async function fetchLiveCityFromCoordinates(lat, lng) {
  const cacheKey = `geocode_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  const cached = await locationCache.get(cacheKey);
  if (cached) return cached;

  const query = new URLSearchParams({ latitude: String(lat), longitude: String(lng) });
  const response = await apiClient.get(`/api/v1/location/reverse-geocode?${query}`);
  if (response.data) {
    await locationCache.set(cacheKey, response.data, 30 * 60 * 1000);
  }
  return response.data;
}

export async function searchLiveCities(query) {
  return query ? [] : [];
}

export async function persistLastLocation(lat, lng, city) {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng, city, timestamp: Date.now() }));
  } catch {}
}

export async function getLastLiveLocation() {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
