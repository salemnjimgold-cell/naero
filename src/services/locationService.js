import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

const {
  createDeviceSnapshot,
  createLocationAuthority,
  createManualSnapshot,
  getDisplayCity,
  isSignificantLocationChange,
  isValidCoordinates,
  migrateV2LocationAuthority,
  normalizeLocationAuthority,
  normalizeAddress,
  readOwn,
} = require('./locationCore');

const STORAGE_KEY = '@naero_location_state_v2';
const PREFERENCE_KEY = '@naero_location_preference_v2';
const AUTHORITY_KEY = '@naero_location_authority_v3';
const LEGACY_LOCATION_KEY = '@naero_last_location';
const LEGACY_CITY_KEY = '@naero_manual_city';

let cachedSnapshot = null;
let cachedPreference = 'auto';
let cachedAuthority = null;
let authorityLoadPromise = null;
let activeSubscription = null;
let authorityIntentVersion = 0;
let authorityWriteInFlight = false;
const pendingManualIntents = new Set();

function syncAuthorityCache(authority) {
  cachedAuthority = authority;
  cachedSnapshot = authority.snapshot;
  cachedPreference = authority.preference;
}

function activeSnapshot(authority = cachedAuthority) {
  return authority && authority.preference !== 'off' ? authority.snapshot : null;
}

function makeResult(overrides = {}) {
  return {
    snapshot: activeSnapshot(),
    preference: cachedAuthority?.preference || cachedPreference,
    authority: cachedAuthority,
    accepted: true,
    permissionStatus: 'undetermined',
    servicesEnabled: null,
    error: null,
    ...overrides,
  };
}

function parseJson(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

async function readOrMigrateAuthority() {
  try {
    const v3Raw = await AsyncStorage.getItem(AUTHORITY_KEY);
    const v3 = normalizeLocationAuthority(parseJson(v3Raw));
    if (v3) {
      syncAuthorityCache(v3);
      return v3;
    }

    const [snapshotRaw, preferenceRaw, legacyCity, legacyLocationRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PREFERENCE_KEY),
      AsyncStorage.getItem(LEGACY_CITY_KEY),
      AsyncStorage.getItem(LEGACY_LOCATION_KEY),
    ]);
    let snapshotPresent = Boolean(snapshotRaw);
    let snapshot = parseJson(snapshotRaw);
    let preferencePresent = preferenceRaw !== null;
    let preference = preferenceRaw;
    if (!snapshotPresent && !legacyCity && legacyLocationRaw) {
      snapshotPresent = true;
      snapshot = createDeviceSnapshot(parseJson(legacyLocationRaw), null);
      if (!preferencePresent) {
        preferencePresent = true;
        preference = 'auto';
      }
    }
    const migrated = migrateV2LocationAuthority({ preferencePresent, preference, snapshotPresent, snapshot });
    await AsyncStorage.setItem(AUTHORITY_KEY, JSON.stringify(migrated));
    syncAuthorityCache(migrated);
    return migrated;
  } catch {
    return createLocationAuthority('off', null);
  }
}

async function loadAuthority() {
  if (cachedAuthority) return cachedAuthority;
  if (!authorityLoadPromise) {
    authorityLoadPromise = readOrMigrateAuthority().finally(() => {
      authorityLoadPromise = null;
    });
  }
  return authorityLoadPromise;
}

async function commitAuthority(candidate, options = {}) {
  const intentVersion = options.intentVersion;
  const eligibility = options.eligibility;
  const previous = await loadAuthority();
  const normalizedCandidate = normalizeLocationAuthority(candidate);
  if (!normalizedCandidate) {
    return makeResult({
      snapshot: activeSnapshot(previous), preference: previous.preference, authority: previous,
      accepted: false,
      error: { code: 'INVALID_LOCATION_AUTHORITY', message: 'The location choice is invalid.' },
    });
  }
  if (authorityWriteInFlight) {
    return makeResult({
      snapshot: activeSnapshot(previous),
      preference: previous.preference,
      authority: previous,
      accepted: false,
      error: { code: 'LOCATION_BUSY', message: 'Another location change is finishing. Try again.' },
    });
  }
  if ((intentVersion !== undefined && intentVersion !== authorityIntentVersion) || (eligibility && !eligibility(previous))) {
    return makeResult({
      snapshot: activeSnapshot(previous), preference: previous.preference, authority: previous,
      error: { code: 'STALE_LOCATION_INTENT', message: 'A newer location choice is being used.' },
    });
  }
  authorityWriteInFlight = true;
  try {
    if ((intentVersion !== undefined && intentVersion !== authorityIntentVersion) || (eligibility && !eligibility(cachedAuthority || previous))) {
      return makeResult({
        snapshot: activeSnapshot(previous), preference: previous.preference, authority: previous,
        error: { code: 'STALE_LOCATION_INTENT', message: 'A newer location choice is being used.' },
      });
    }
    await AsyncStorage.setItem(AUTHORITY_KEY, JSON.stringify(normalizedCandidate));
    syncAuthorityCache(normalizedCandidate);
    return makeResult();
  } catch {
    return makeResult({
      snapshot: activeSnapshot(previous), preference: previous.preference, authority: previous,
      error: { code: 'LOCATION_PERSISTENCE_FAILED', message: 'The location choice could not be saved. Try again.' },
    });
  } finally {
    authorityWriteInFlight = false;
  }
}

async function loadSnapshot() {
  return (await loadAuthority()).snapshot;
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

async function captureCurrentPosition({ force = false, intentVersion = authorityIntentVersion, automatic = false } = {}) {
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

    const previous = await loadAuthority();
    if (!force && !isSignificantLocationChange(previous.snapshot, next)) {
      return makeResult({ permissionStatus: 'granted', servicesEnabled });
    }
    if (automatic && pendingManualIntents.size > 0) {
      return makeResult({ error: { code: 'STALE_LOCATION_INTENT', message: 'A newer location choice is being used.' }, permissionStatus: 'granted', servicesEnabled });
    }
    const result = await commitAuthority(createLocationAuthority('auto', next), {
      intentVersion,
      eligibility: (latest) => !automatic || (latest.preference === 'auto' && pendingManualIntents.size === 0),
    });
    return { ...result, permissionStatus: 'granted', servicesEnabled };
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
  const [authority, permissionStatus, servicesEnabled] = await Promise.all([
    loadAuthority(),
    getLocationPermissionStatus(),
    getLocationServicesEnabled(),
  ]);
  return makeResult({ snapshot: activeSnapshot(authority), preference: authority.preference, authority, permissionStatus, servicesEnabled });
}

export async function requestForegroundLocation() {
  const intentVersion = ++authorityIntentVersion;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return makeResult({
        permissionStatus: status,
        servicesEnabled: await getLocationServicesEnabled(),
        error: { code: 'PERMISSION_DENIED', message: 'Foreground location permission was not granted.' },
      });
    }
    return captureCurrentPosition({ force: true, intentVersion });
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
  const authority = await loadAuthority();
  if (authority.preference === 'off') {
    return makeResult({
      snapshot: null,
      preference: 'off',
      permissionStatus: await getLocationPermissionStatus(),
      servicesEnabled: await getLocationServicesEnabled(),
    });
  }
  if (authority.preference === 'manual') {
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
  const intentVersion = ++authorityIntentVersion;
  return captureCurrentPosition({ force: true, intentVersion });
}

export async function setManualLocation(city) {
  if (authorityWriteInFlight) {
    const previous = await loadAuthority();
    return makeResult({ snapshot: activeSnapshot(previous), preference: previous.preference, authority: previous, accepted: false, error: { code: 'LOCATION_BUSY', message: 'Another location change is finishing. Try again.' } });
  }
  const selectionVersion = ++authorityIntentVersion;
  pendingManualIntents.add(selectionVersion);
  const trimmedCity = typeof city === 'string' ? city.trim().replace(/\s+/g, ' ') : '';
  if (!trimmedCity) {
    pendingManualIntents.delete(selectionVersion);
    return makeResult({
      permissionStatus: await getLocationPermissionStatus(),
      servicesEnabled: await getLocationServicesEnabled(),
      error: { code: 'INVALID_CITY', message: 'Enter a city name.' },
    });
  }

  try {
    const matches = await Location.geocodeAsync(trimmedCity);
    const first = Array.isArray(matches) ? matches[0] : null;
    const latitude = readOwn(first, 'latitude');
    const longitude = readOwn(first, 'longitude');
    if (!isValidCoordinates(latitude, longitude)) {
      return makeResult({
        permissionStatus: await getLocationPermissionStatus(),
        servicesEnabled: await getLocationServicesEnabled(),
        error: { code: 'CITY_NOT_FOUND', message: 'City could not be found. Check the city name and try again.' },
      });
    }
    const address = await reverseGeocodeLocation(latitude, longitude);
    const resolvedCity = normalizeAddress(address).city || trimmedCity;
    const snapshot = createManualSnapshot(resolvedCity, { ...normalizeAddress(address), latitude, longitude });
    if (!snapshot) throw new Error('INVALID_RESOLVED_CITY');
    if (selectionVersion !== authorityIntentVersion) {
      return makeResult({
        permissionStatus: await getLocationPermissionStatus(),
        servicesEnabled: await getLocationServicesEnabled(),
        error: { code: 'STALE_CITY_SELECTION', message: 'A newer city selection is already being used.' },
      });
    }
    const result = await commitAuthority(createLocationAuthority('manual', snapshot), { intentVersion: selectionVersion });
    return { ...result, permissionStatus: await getLocationPermissionStatus(), servicesEnabled: await getLocationServicesEnabled() };
  } catch {
    return makeResult({
      permissionStatus: await getLocationPermissionStatus(),
      servicesEnabled: await getLocationServicesEnabled(),
      error: { code: 'CITY_RESOLUTION_FAILED', message: 'City could not be found. Check the city name and try again.' },
    });
  } finally {
    pendingManualIntents.delete(selectionVersion);
  }
}

export async function disableLocationUse() {
  stopSignificantLocationUpdates();
  const intentVersion = ++authorityIntentVersion;
  const current = await loadAuthority();
  const result = await commitAuthority(createLocationAuthority('off', current.snapshot), { intentVersion });
  return { ...result, permissionStatus: await getLocationPermissionStatus(), servicesEnabled: await getLocationServicesEnabled() };
}

export async function clearStoredLocationData() {
  stopSignificantLocationUpdates();
  const intentVersion = ++authorityIntentVersion;
  const result = await commitAuthority(createLocationAuthority('off', null), { intentVersion });
  if (!result.error) {
    AsyncStorage.multiRemove([STORAGE_KEY, PREFERENCE_KEY, LEGACY_LOCATION_KEY, LEGACY_CITY_KEY]).catch(() => {});
  }
  return { ...result, permissionStatus: await getLocationPermissionStatus(), servicesEnabled: await getLocationServicesEnabled() };
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
        if (pendingManualIntents.size > 0 || cachedAuthority?.preference !== 'auto') return;
        const result = await commitAuthority(createLocationAuthority('auto', next), {
          intentVersion: authorityIntentVersion,
          eligibility: (latest) => latest.preference === 'auto' && pendingManualIntents.size === 0,
        });
        if (!result.error) onChange?.({ ...result, permissionStatus: 'granted', servicesEnabled: true });
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
  authority: AUTHORITY_KEY,
  state: STORAGE_KEY,
  preference: PREFERENCE_KEY,
};
