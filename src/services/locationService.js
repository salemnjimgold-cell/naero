import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@naero_last_location';
const CITY_KEY = '@naero_manual_city';

let lastKnownLocation = null;
let lastKnownCity = null;

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentPosition() {
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    lastKnownLocation = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lastKnownLocation));
    return lastKnownLocation;
  } catch {
    return null;
  }
}

export async function getLocationPermissionStatus() {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
}

export async function getUserLocation() {
  if (lastKnownLocation) return lastKnownLocation;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      lastKnownLocation = JSON.parse(stored);
      return lastKnownLocation;
    }
  } catch {}
  return null;
}

export async function refreshUserLocation() {
  const hasPermission = await getLocationPermissionStatus();
  if (hasPermission !== 'granted') return null;
  return getCurrentPosition();
}

export async function geocodeLocation(latitude, longitude) {
  try {
    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocode && geocode.length > 0) {
      const addr = geocode[0];
      lastKnownCity = addr.city || addr.subregion || addr.region || 'Budapest';
      return lastKnownCity;
    }
  } catch {}
  return null;
}

export async function getLastKnownCity() {
  if (lastKnownCity) return lastKnownCity;
  const loc = await getUserLocation();
  if (loc) {
    return geocodeLocation(loc.latitude, loc.longitude);
  }
  return null;
}

export async function saveManualCity(city) {
  await AsyncStorage.setItem(CITY_KEY, city);
  lastKnownCity = city;
}

export async function getManualCity() {
  try {
    return await AsyncStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}

export async function clearLocation() {
  lastKnownLocation = null;
  lastKnownCity = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
  await AsyncStorage.removeItem(CITY_KEY);
}

export async function hasLocationPermission() {
  const status = await getLocationPermissionStatus();
  return status === 'granted';
}
