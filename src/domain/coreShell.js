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
  const item = safeRead(params, 'item');
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

  const id = boundedString(safeRead(item, 'id'), 200);
  const name = boundedString(safeRead(item, 'name'), 300);
  const provider = boundedString(safeRead(item, 'provider'), 100)
    || boundedString(safeRead(item, 'source'), 100);
  if (!id || !name || !provider) return null;

  const normalized = { id, name, provider };
  for (const [field, max] of Object.entries({
    providerId: 200, category: 100, description: 2000, address: 500, city: 200,
    district: 200, region: 200, country: 100, postalCode: 40, hours: 500,
    attribution: 500, licence: 100, sourceReference: 1000, priceLevel: 20,
  })) {
    const value = boundedString(safeRead(item, field), max);
    if (value) normalized[field] = value;
  }

  const phone = normalizePhone(safeRead(item, 'phone'));
  if (phone) normalized.phone = phone.display;
  if (phone) normalized.phoneTarget = phone.target;

  const latitude = safeRead(item, 'latitude');
  const longitude = safeRead(item, 'longitude');
  if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
      && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
    normalized.latitude = latitude;
    normalized.longitude = longitude;
  }

  const imageUrl = boundedString(safeRead(item, 'image_url'), 2000)
    || boundedString(safeRead(item, 'image'), 2000);
  if (imageUrl && /^https:\/\//i.test(imageUrl)) normalized.image_url = imageUrl;

  const tags = safeRead(item, 'tags');
  if (Array.isArray(tags)) {
    const safeTags = tags.slice(0, 12).map((tag) => boundedString(tag, 80)).filter(Boolean);
    if (safeTags.length) normalized.tags = safeTags;
  }
  for (const field of ['rating', 'reviews']) {
    const value = safeRead(item, field);
    if (Number.isFinite(value) && value >= 0) normalized[field] = value;
  }
  if (safeRead(item, 'demo') === true) normalized.demo = true;
  return normalized;
}

function safeRead(value, key) {
  try { return value?.[key]; } catch { return undefined; }
}

function boundedString(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

function normalizePhone(value) {
  const display = boundedString(value, 80);
  if (!display) return null;
  const target = display.replace(/[^+\d]/g, '');
  if (!target || target === '+' || !/^\+?\d{3,20}$/.test(target)) return null;
  return { display, target };
}

function buildPhoneUrl(item) {
  return item?.phoneTarget && /^\+?\d{3,20}$/.test(item.phoneTarget) ? `tel:${item.phoneTarget}` : null;
}

function buildDirectionsUrl(item) {
  const address = boundedString(item?.address, 500);
  const coordinates = Number.isFinite(item?.latitude) && item.latitude >= -90 && item.latitude <= 90
    && Number.isFinite(item?.longitude) && item.longitude >= -180 && item.longitude <= 180
    ? `${item.latitude},${item.longitude}` : null;
  const destination = address || coordinates;
  return destination ? `https://maps.google.com/?q=${encodeURIComponent(destination)}` : null;
}

module.exports = { buildDirectionsUrl, buildPhoneUrl, getHomeState, hasCoordinates, normalizePlaceDetailParams };
