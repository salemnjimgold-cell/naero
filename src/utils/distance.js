export function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  return getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) * 1000;
}

export function isWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
  const distance = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

export function sortByDistance(items, userLat, userLng, radiusKm = null) {
  const withDistance = items.map((item) => {
    const distance = getDistanceFromLatLonInKm(userLat, userLng, item.latitude, item.longitude);
    return { ...item, distance };
  });
  const filtered = radiusKm
    ? withDistance.filter((item) => item.distance <= radiusKm)
    : withDistance;
  return filtered.sort((a, b) => a.distance - b.distance);
}
