import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

const {
  createDeviceSnapshot,
  createManualSnapshot,
  getDisplayCity,
  isSignificantLocationChange,
  isValidCoordinates,
  normalizeAddress,
} = require('./locationCore');

const STORAGE_KEY = '@naero_location_state_v2';
const PREFERENCE_KEY = '@naero_location_preference_v2';
const LEGACY_LOCATION_KEY = '@naero_last_location';
const LEGACY_CITY_KEY = '@naero_manual_city';

let cachedSnapshot = null;
let cachedPreference = 'auto';
let activeSubscription = null;

function makeResult(overrides = {}) {
  return {
    snapshot: cachedSnapshot,
    preference: cachedPreference,
    permissionStatus: 'undetermined',
    servicesEnabled: null,
    error: null,
    ...overrides,
  };
}

async function persistSnapshot(snapshot) {
  cachedSnapshot = snapshot;
  if (snapshot) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

async function loadSnapshot() {
  if (cachedSnapshot) return cachedSnapshot;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!['device', 'manual'].includes(parsed?.mode)) return null;
      cachedSnapshot = parsed;
      return cachedSnapshot;
    }

    const [legacyCity, legacyLocationRaw] = await Promise.all([
      AsyncStorage.getItem(LEGACY_CITY_KEY),
      AsyncStorage.getItem(LEGACY_LOCATION_KEY),
    ]);
    if (legacyCity) {
      cachedSnapshot = createManualSnapshot(legacyCity);
    } else if (legacyLocationRaw) {
      const legacyLocation = JSON.parse(legacyLocationRaw);
      cachedSnapshot = createDeviceSnapshot(legacyLocation, null);
    }
    if (cachedSnapshot) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSnapshot));
      await AsyncStorage.multiRemove([LEGACY_CITY_KEY, LEGACY_LOCATION_KEY]);
    }
    return cachedSnapshot;
  } catch {
    return null;
  }
}

async function loadPreference() {
  try {
    const value = await AsyncStorage.getItem(PREFERENCE_KEY);
    cachedPreference = ['auto', 'manual', 'off'].includes(value) ? value : 'auto';
  } catch {
    cachedPreference = 'auto';
  }
  return cachedPreference;
}

async function savePreference(preference) {
  cachedPreference = preference;
  await AsyncStorage.setItem(PREFERENCE_KEY, preference);
}

export async function getLocationPermissionStatus() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  } catch {
    return 'undetermined';
  }
}

export async function getLocationServicesEnabled() {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return null;
  }
}

export async function reverseGeocodeLocation(latitude, longitude) {
  if (!isValidCoordinates(latitude, longitude)) return null;
  try {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
    }).toString();
    const gateway = await apiClient.get(`/api/v1/location/reverse-geocode?${query}`);
    if (!gateway.error && gateway.data) return normalizeAddress(gateway.data);

    // Preserve the Milestone 1 device fallback when the optional backend/provider is unavailable.
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!Array.isArray(results) || results.length === 0) return null;
    return normalizeAddress(results[0]);
  } catch {
    return null;
  }
}

async function captureCurrentPosition({ force = false } = {}) {
  const servicesEnabled = await getLocationServicesEnabled();
  if (servicesEnabled === false) {
    return makeResult({
      permissionStatus: 'granted',
      servicesEnabled,
      error: { code: 'GPS_DISABLED', message: 'Location services are disabled on this device.' },
    });
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: true,
    });
    const address = await reverseGeocodeLocation(position.coords.latitude, position.coords.longitude);
    const next = createDeviceSnapshot(position, address);
    if (!next) {
      return makeResult({
        permissionStatus: 'granted',
        servicesEnabled,
        error: { code: 'INVALID_LOCATION', message: 'The device returned invalid coordinates.' },
      });
    }

    const previous = await loadSnapshot();
    if (force || isSignificantLocationChange(previous, next)) {
      await persistSnapshot(next);
    } else {
      cachedSnapshot = { ...previous, address: address || previous.address };
    }

    await savePreference('auto');
    return makeResult({ snapshot: cachedSnapshot, permissionStatus: 'granted', servicesEnabled });
  } catch (error) {
    return makeResult({
      permissionStatus: 'granted',
      servicesEnabled,
      error: {
        code: 'LOCATION_UNAVAILABLE',
        message: error?.message || 'Current location could not be retrieved.',
      },
    });
  }
}

export async function initializeLocation() {
  let preference = await loadPreference();
  const [snapshot, permissionStatus, servicesEnabled] = await Promise.all([
    loadSnapshot(),
    getLocationPermissionStatus(),
    getLocationServicesEnabled(),
  ]);
  if (snapshot?.mode === 'manual' && preference === 'auto') {
    await savePreference('manual');
    preference = 'manual';
  }

  if (preference === 'off') {
    return makeResult({ snapshot: null, preference, permissionStatus, servicesEnabled });
  }
  if (preference === 'manual' && snapshot?.mode === 'manual') {
    return makeResult({ snapshot, preference, permissionStatus, servicesEnabled });
  }
  return makeResult({ snapshot, preference, permissionStatus, servicesEnabled });
}

export async function requestForegroundLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return makeResult({
        permissionStatus: status,
        servicesEnabled: await getLocationServicesEnabled(),
        error: { code: 'PERMISSION_DENIED', message: 'Foreground location permission was not granted.' },
      });
    }
    return captureCurrentPosition({ force: true });
  } catch (error) {
    return makeResult({
      permissionStatus: 'undetermined',
      servicesEnabled: await getLocationServicesEnabled(),
      error: {
        code: 'PERMISSION_ERROR',
        message: error?.message || 'Location permission could not be requested.',
      },
    });
  }
}

export async function refreshLocationState() {
  const preference = await loadPreference();
  if (preference === 'off') {
    return makeResult({
      snapshot: null,
      preference,
      permissionStatus: await getLocationPermissionStatus(),
      servicesEnabled: await getLocationServicesEnabled(),
    });
  }
  if (preference === 'manual') {
    return initializeLocation();
  }
  const permissionStatus = await getLocationPermissionStatus();
  if (permissionStatus !== 'granted') {
    return makeResult({
      permissionStatus,
      servicesEnabled: await getLocationServicesEnabled(),
      error: { code: 'PERMISSION_DENIED', message: 'Foreground location permission is unavailable.' },
    });
  }
  return captureCurrentPosition({ force: true });
}

export async function setManualLocation(city) {
  const trimmedCity = typeof city === 'string' ? city.trim().replace(/\s+/g, ' ') : '';
  if (!trimmedCity) {
    return makeResult({
      permissionStatus: await getLocationPermissionStatus(),
      servicesEnabled: await getLocationServicesEnabled(),
      error: { code: 'INVALID_CITY', message: 'Enter a city name.' },
    });
  }

  let details = {};
  try {
    const matches = await Location.geocodeAsync(trimmedCity);
    const first = Array.isArray(matches) ? matches[0] : null;
    if (first && isValidCoordinates(first.latitude, first.longitude)) {
      const address = await reverseGeocodeLocation(first.latitude, first.longitude);
      details = {
        ...address,
        latitude: first.latitude,
        longitude: first.longitude,
      };
    }
  } catch {
    // Manual mode remains usable when the geocoder is unavailable.
  }

  const snapshot = createManualSnapshot(trimmedCity, details);
  await persistSnapshot(snapshot);
  await savePreference('manual');
  return makeResult({
    snapshot,
    preference: 'manual',
    permissionStatus: await getLocationPermissionStatus(),
    servicesEnabled: await getLocationServicesEnabled(),
  });
}

export async function disableLocationUse() {
  stopSignificantLocationUpdates();
  await savePreference('off');
  return makeResult({
    snapshot: null,
    preference: 'off',
    permissionStatus: await getLocationPermissionStatus(),
    servicesEnabled: await getLocationServicesEnabled(),
  });
}

export async function clearStoredLocationData() {
  stopSignificantLocationUpdates();
  cachedSnapshot = null;
  cachedPreference = 'off';
  await AsyncStorage.multiRemove([
    STORAGE_KEY,
    PREFERENCE_KEY,
    LEGACY_LOCATION_KEY,
    LEGACY_CITY_KEY,
  ]);
  await AsyncStorage.setItem(PREFERENCE_KEY, 'off');
  return makeResult({
    snapshot: null,
    preference: 'off',
    permissionStatus: await getLocationPermissionStatus(),
    servicesEnabled: await getLocationServicesEnabled(),
  });
}

export async function startSignificantLocationUpdates(onChange) {
  stopSignificantLocationUpdates();
  const state = await initializeLocation();
  if (state.preference !== 'auto' || state.permissionStatus !== 'granted') return () => {};

  try {
    activeSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 250,
        timeInterval: 60 * 1000,
      },
      async (position) => {
        const address = await reverseGeocodeLocation(position.coords.latitude, position.coords.longitude);
        const next = createDeviceSnapshot(position, address);
        if (!next || !isSignificantLocationChange(cachedSnapshot, next)) return;
        await persistSnapshot(next);
        onChange?.(makeResult({
          snapshot: next,
          preference: 'auto',
          permissionStatus: 'granted',
          servicesEnabled: true,
        }));
      }
    );
  } catch {
    activeSubscription = null;
  }
  return stopSignificantLocationUpdates;
}

export function stopSignificantLocationUpdates() {
  if (activeSubscription) {
    activeSubscription.remove();
    activeSubscription = null;
  }
}

// Compatibility exports for existing consumers during Milestone 1.
export async function requestLocationPermission() {
  const result = await requestForegroundLocation();
  return result.permissionStatus === 'granted' && Boolean(result.snapshot);
}

export async function getCurrentPosition() {
  const result = await captureCurrentPosition({ force: true });
  return result.snapshot;
}

export async function getUserLocation() {
  return loadSnapshot();
}

export async function refreshUserLocation() {
  const result = await refreshLocationState();
  return result.snapshot;
}

export async function geocodeLocation(latitude, longitude) {
  const address = await reverseGeocodeLocation(latitude, longitude);
  return address?.city || null;
}

export async function getLastKnownCity() {
  return getDisplayCity(await loadSnapshot());
}

export async function saveManualCity(city) {
  const result = await setManualLocation(city);
  return result.error ? null : result.snapshot;
}

export async function getManualCity() {
  const snapshot = await loadSnapshot();
  return snapshot?.mode === 'manual' ? getDisplayCity(snapshot) : null;
}

export async function clearLocation() {
  return clearStoredLocationData();
}

export async function hasLocationPermission() {
  return (await getLocationPermissionStatus()) === 'granted';
}

export const LOCATION_STORAGE_KEYS = {
  state: STORAGE_KEY,
  preference: PREFERENCE_KEY,
};
