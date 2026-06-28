import { searchNearbyPlaces, searchCityPlaces } from './api/overpassApi';
import { reverseGeocode, searchCity } from './api/nominatimApi';
import { isGooglePlacesConfigured, nearbySearch, textSearch } from './api/googlePlacesApi';
import { placeService } from './placeService';
import { getDistanceFromLatLonInKm } from '../utils/distance';
import { placesCache, locationCache } from './cacheService';

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

  const cacheKey = `nearby_${lat.toFixed(4)}_${lng.toFixed(4)}_${radiusKm}_${category || 'all'}`;
  const cached = await placesCache.get(cacheKey);
  if (cached) return { source: 'cache', data: cached };

  const results = [];

  const overpassPlaces = await searchNearbyPlaces(lat, lng, radiusKm, category);
  if (overpassPlaces.length) {
    results.push(...overpassPlaces.map(p => ({ ...p, source: 'overpass' })));
  }

  if (isGooglePlacesConfigured()) {
    const gtype = category ? _mapCategoryToGoogleType(category) : null;
    const googleResult = await nearbySearch(lat, lng, radiusKm * 1000, gtype);
    if (googleResult.configured && googleResult.data.length) {
      const merged = _mergeOverpassAndGoogle(results, googleResult.data);
      results.length = 0;
      results.push(...merged);
    }
  }

  const localPlaces = placeService ? await placeService.getNearby(lat, lng, radiusKm, category) : [];
  if (localPlaces.length) {
    const existingIds = new Set(results.map(r => r.id));
    for (const p of localPlaces) {
      if (!existingIds.has(p.id)) {
        results.push({ ...p, source: p.source || 'local' });
      }
    }
  }

  results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  await placesCache.set(cacheKey, results, 5 * 60 * 1000);
  return { source: 'live', data: results };
}

export async function fetchLivePlacesByCity(cityName, category = null) {
  if (!_realtimeEnabled) return { source: 'disabled', data: [] };

  const cacheKey = `city_${cityName.toLowerCase()}_${category || 'all'}`;
  const cached = await placesCache.get(cacheKey);
  if (cached) return { source: 'cache', data: cached };

  const overpassPlaces = await searchCityPlaces(cityName, category);
  if (overpassPlaces.length) {
    await placesCache.set(cacheKey, overpassPlaces, 10 * 60 * 1000);
    return { source: 'live', data: overpassPlaces };
  }

  return { source: 'unavailable', data: [] };
}

export async function fetchLiveCityFromCoordinates(lat, lng) {
  const cacheKey = `geocode_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  const cached = await locationCache.get(cacheKey);
  if (cached) return cached;

  const result = await reverseGeocode(lat, lng);
  if (result) {
    await locationCache.set(cacheKey, result, 30 * 60 * 1000);
  }
  return result;
}

export async function searchLiveCities(query) {
  return searchCity(query, 5);
}

function _mergeOverpassAndGoogle(overpass, google) {
  const merged = [...overpass];
  const existingNames = new Set(overpass.map(p => p.name?.toLowerCase()));
  for (const g of google) {
    if (!existingNames.has(g.name?.toLowerCase())) {
      merged.push(g);
    }
  }
  return merged;
}

function _mapCategoryToGoogleType(category) {
  const map = {
    restaurant: 'restaurant',
    cafe: 'cafe',
    halalFood: 'restaurant',
    supermarket: 'supermarket',
    pharmacy: 'pharmacy',
    hospital: 'hospital',
    clinic: 'doctor',
    bank: 'bank',
    atm: 'atm',
    transport: 'bus_station',
    police: 'police',
    fireStation: 'fire_station',
    embassy: 'embassy',
    communityCenter: 'community_center',
    placeOfWorship: 'church',
    school: 'school',
    library: 'library',
    postOffice: 'post_office',
  };
  return map[category] || null;
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
