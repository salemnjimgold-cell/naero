function hasCoordinates(location) {
  return Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);
}

function getHomeState({ auth, userCity, userLocation, nearbyPlaces, loading, error }) {
  const located = hasCoordinates(userLocation);
  const places = Array.isArray(nearbyPlaces)
    ? normalizePlaceCollection(nearbyPlaces).slice(0, 3)
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

function normalizePlaceCollection(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizePlaceDetailParams({ item })).filter(Boolean);
}

function normalizePlaceDetailParams(params) {
  if (!isRecord(params)) return null;
  const item = safeReadOwn(params, 'item');
  if (!isRecord(item)) return null;

  const id = boundedString(safeReadOwn(item, 'id'), 200);
  const name = boundedString(safeReadOwn(item, 'name'), 300);
  const provider = boundedString(safeReadOwn(item, 'provider'), 100)
    || boundedString(safeReadOwn(item, 'source'), 100);
  if (!id || !name || !provider) return null;

  const normalized = Object.assign(Object.create(null), { id, name, provider });
  for (const [field, max] of Object.entries({
    providerId: 200, category: 100, description: 2000, address: 500, city: 200,
    district: 200, region: 200, country: 100, postalCode: 40, hours: 500,
    attribution: 500, licence: 100, sourceReference: 1000, priceLevel: 20,
  })) {
    const value = boundedString(safeReadOwn(item, field), max);
    if (value) normalized[field] = value;
  }

  const phone = normalizePhone(safeReadOwn(item, 'phone'));
  if (phone) normalized.phone = phone.display;
  if (phone) normalized.phoneTarget = phone.target;

  const latitude = safeReadOwn(item, 'latitude');
  const longitude = safeReadOwn(item, 'longitude');
  if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
      && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
    normalized.latitude = latitude;
    normalized.longitude = longitude;
  }

  const imageUrl = boundedString(safeReadOwn(item, 'image_url'), 2000)
    || boundedString(safeReadOwn(item, 'image'), 2000);
  if (imageUrl && /^https:\/\//i.test(imageUrl)) normalized.image_url = imageUrl;

  const tags = safeReadOwn(item, 'tags');
  if (Array.isArray(tags)) {
    const safeTags = tags.slice(0, 12).map((tag) => boundedString(tag, 80)).filter(Boolean);
    if (safeTags.length) normalized.tags = safeTags;
  }
  for (const field of ['rating', 'reviews']) {
    const value = safeReadOwn(item, field);
    if (Number.isFinite(value) && value >= 0) normalized[field] = value;
  }
  if (safeReadOwn(item, 'demo') === true) normalized.demo = true;
  return normalized;
}

function isRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function safeReadOwn(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  try {
    if (!Object.prototype.hasOwnProperty.call(value, key)) return undefined;
    return value[key];
  } catch {
    return undefined;
  }
}

function boundedString(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

function normalizePhone(value) {
  if (typeof value !== 'string' || value.length > 80) return null;
  if (/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/u.test(value)) return null;
  const display = value.replace(/^ +| +$/g, '');
  if (!display || !/^\+?[0-9 ().-]+$/.test(display)) return null;
  const target = display.replace(/[ ().-]/g, '');
  const digits = target.startsWith('+') ? target.slice(1) : target;
  if (!/^\d{3,20}$/.test(digits)) return null;
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

module.exports = { buildDirectionsUrl, buildPhoneUrl, getHomeState, hasCoordinates, normalizePlaceCollection, normalizePlaceDetailParams };
