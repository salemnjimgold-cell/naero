function hasCoordinates(location) {
  return Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);
}

function getHomeState({ auth, userCity, userLocation, nearbyPlaces, loading, error }) {
  const located = hasCoordinates(userLocation);
  const places = Array.isArray(nearbyPlaces)
    ? nearbyPlaces.filter((place) => place && place.id && place.name).slice(0, 3)
    : [];
  return {
    displayName: auth?.mode === 'authenticated' ? (auth.user?.displayName || null) : null,
    isGuest: auth?.mode !== 'authenticated',
    locationLabel: located ? (userCity || null) : null,
    hasResolvedLocation: located,
    places,
    loading: Boolean(loading && located),
    error: error ? String(error) : null,
  };
}

function normalizePlaceDetailParams(params) {
  const item = params?.item;
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  if (!item.id || typeof item.name !== 'string' || !item.name.trim()) return null;
  return item;
}

module.exports = { getHomeState, hasCoordinates, normalizePlaceDetailParams };
