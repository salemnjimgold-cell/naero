import { PRIORITY_CITIES } from '../data/schema';

export function getCityCoordinates(cityName) {
  const city = PRIORITY_CITIES.find(
    (c) => c.city.toLowerCase() === cityName.toLowerCase()
  );
  return city ? { lat: city.lat, lng: city.lng } : null;
}

export function getCityFromCoordinates(lat, lng) {
  let closest = null;
  let minDist = Infinity;
  PRIORITY_CITIES.forEach((city) => {
    const dist = Math.sqrt(
      Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closest = city;
    }
  });
  return closest ? closest.city : 'Unknown';
}

export function isNearCity(lat, lng, cityName, thresholdKm = 30) {
  const coords = getCityCoordinates(cityName);
  if (!coords) return false;
  const { getDistanceFromLatLonInKm } = require('./distance');
  const dist = getDistanceFromLatLonInKm(lat, lng, coords.lat, coords.lng);
  return dist <= thresholdKm;
}

export function filterByCity(items, cityName) {
  if (!cityName) return items;
  return items.filter(
    (item) => item.city && item.city.toLowerCase() === cityName.toLowerCase()
  );
}

export function getCitiesForCountry(country = 'Hungary') {
  return PRIORITY_CITIES.filter((c) => c.country === country);
}
