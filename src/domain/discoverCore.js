const provenance = require('./provenance');

const CITY_ANCHORS = Object.freeze({
  'AT:Vienna': Object.freeze({ latitude: 48.2082, longitude: 16.3738 }),
  'AT:St. Pölten': Object.freeze({ latitude: 48.2047, longitude: 15.6256 }),
  'AT:Graz': Object.freeze({ latitude: 47.0707, longitude: 15.4395 }),
  'HU:Győr': Object.freeze({ latitude: 47.6875, longitude: 17.6504 }),
  'HU:Budapest': Object.freeze({ latitude: 47.4979, longitude: 19.0402 }),
  'FR:Paris': Object.freeze({ latitude: 48.8566, longitude: 2.3522 }),
  'DE:Berlin': Object.freeze({ latitude: 52.52, longitude: 13.405 }),
});

const CATEGORY_GROUPS = Object.freeze([
  Object.freeze({ id: 'essential', categories: Object.freeze(['pharmacy', 'hospital', 'supermarket', 'public_transport']) }),
  Object.freeze({ id: 'services', categories: Object.freeze(['government_office', 'police', 'bank', 'post_office']) }),
  Object.freeze({ id: 'support', categories: Object.freeze(['language_school', 'community_center', 'job_center']) }),
]);

const SEARCH_CATEGORY_TERMS = Object.freeze({
  pharmacy: ['pharmacy', 'chemist', 'apotheke', 'صيدلية', 'gyógyszertár'],
  hospital: ['hospital', 'clinic', 'doctor', 'health', 'krankenhaus', 'مستشفى', 'kórház'],
  supermarket: ['grocery', 'groceries', 'supermarket', 'market', 'lebensmittel', 'بقالة', 'élelmiszer'],
  public_transport: ['transport', 'station', 'train', 'bus', 'verkehr', 'نقل', 'közlekedés'],
  government_office: ['government', 'public office', 'authority', 'amt', 'حكومة', 'hivatal'],
  police: ['police', 'safety', 'polizei', 'شرطة', 'rendőrség'],
  bank: ['bank', 'atm', 'geldautomat', 'بنك', 'bankautomata'],
  post_office: ['post', 'post office', 'postamt', 'بريد', 'posta'],
  language_school: ['language', 'translation', 'sprach', 'لغة', 'nyelv'],
  community_center: ['community', 'community centre', 'gemeinde', 'مجتمع', 'közösség'],
  job_center: ['job', 'work', 'employment', 'arbeit', 'عمل', 'munka'],
});

function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function hasCoordinates(value) { return finite(value?.latitude) && finite(value?.longitude); }

function resolveDiscoverContext({ onboardingContext, locationState, userLocation } = {}) {
  const known = onboardingContext?.countryCode && onboardingContext?.municipality;
  const manual = onboardingContext?.locationMode === 'manual';
  if (manual && known) {
    const anchor = CITY_ANCHORS[`${onboardingContext.countryCode}:${onboardingContext.municipality}`] || null;
    return Object.freeze({ mode: 'manual', label: `${onboardingContext.municipality}, ${onboardingContext.country}`, origin: onboardingContext.origin, countryCode: onboardingContext.countryCode, municipality: onboardingContext.municipality, coordinates: anchor, showDistance: false });
  }
  const device = hasCoordinates(locationState) ? locationState : hasCoordinates(userLocation) ? userLocation : null;
  if (device) {
    const city = locationState?.address?.city || onboardingContext?.municipality || null;
    const country = locationState?.address?.country || onboardingContext?.country || null;
    return Object.freeze({ mode: 'device', label: [city, country].filter(Boolean).join(', ') || null, origin: 'permission_derived', countryCode: locationState?.address?.countryCode || onboardingContext?.countryCode || null, municipality: city, coordinates: Object.freeze({ latitude: device.latitude, longitude: device.longitude }), showDistance: true });
  }
  if (known) return Object.freeze({ mode: 'unknown', label: `${onboardingContext.municipality}, ${onboardingContext.country}`, origin: onboardingContext.origin || 'unknown', countryCode: onboardingContext.countryCode, municipality: onboardingContext.municipality, coordinates: null, showDistance: false });
  return Object.freeze({ mode: 'unknown', label: null, origin: 'unknown', countryCode: null, municipality: null, coordinates: null, showDistance: false });
}

function categoryForSearch(query, fallback = 'pharmacy') {
  const normalized = typeof query === 'string' ? query.trim().toLocaleLowerCase() : '';
  if (!normalized) return fallback;
  return Object.keys(SEARCH_CATEGORY_TERMS).find((category) => SEARCH_CATEGORY_TERMS[category].some((term) => normalized.includes(term))) || fallback;
}
function recognizedSearchCategory(query) {
  const normalized = typeof query === 'string' ? query.trim().toLocaleLowerCase() : '';
  if (!normalized) return null;
  return Object.keys(SEARCH_CATEGORY_TERMS).find((category) => SEARCH_CATEGORY_TERMS[category].some((term) => normalized.includes(term))) || null;
}

function providerTrust(item) {
  if (item?.provider === 'naero' && item?.verified === true) return 'naero_verified';
  return 'external_provider';
}

function providerName(item) {
  if (item?.provider === 'osm') return item.sourceAttribution || 'OpenStreetMap contributors';
  if (item?.provider === 'google') return item.sourceAttribution || 'Google Places';
  if (item?.provider === 'naero') return 'Naero';
  return item?.sourceAttribution || 'Nearby data provider';
}

function resultProvenance(item, context) {
  return provenance.createProvenance({
    id: item?.id || null,
    trustClass: providerTrust(item),
    publisher: providerName(item),
    sourceUrl: item?.navigationUrl,
    retrievedAt: item?.fetchedAt,
    verifiedAt: providerTrust(item) === 'naero_verified' ? item?.lastVerifiedAt : null,
    freshness: item?.lastVerifiedAt ? 'date_known' : 'date_unknown',
    jurisdiction: context?.countryCode ? { countryCode: context.countryCode, municipality: context.municipality || null } : null,
    verificationScope: providerTrust(item) === 'naero_verified' ? 'Public service record and location' : null,
    uncertainty: providerTrust(item) === 'external_provider' ? 'Provider details may change; confirm consequential information directly.' : null,
  });
}

function normalizeDiscoverResult(item, context) {
  if (!item || typeof item.name !== 'string' || !item.name.trim()) return null;
  const coordinates = hasCoordinates(item) ? Object.freeze({ latitude: item.latitude, longitude: item.longitude }) : null;
  return Object.freeze({
    id: typeof item.id === 'string' ? item.id : `${item.provider || 'provider'}:${item.name}`,
    name: item.name.trim(), category: item.category || null, description: item.description || null,
    address: item.address || null, city: item.city || null, region: item.region || null,
    coordinates, distanceMeters: context?.showDistance && Number.isFinite(item.distanceMeters) ? item.distanceMeters : null,
    phone: typeof item.phone === 'string' && /^[+()\d\s.-]{3,30}$/.test(item.phone) ? item.phone : null,
    website: provenance.normalizeExternalUrl(item.website),
    directionsUrl: coordinates ? provenance.normalizeExternalUrl(item.navigationUrl) || `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}` : null,
    provenance: resultProvenance(item, context), raw: item,
  });
}

function stateForFailure(error, hasCachedData = false) {
  if (hasCachedData) return 'cached';
  const code = error?.code;
  if (['API_NOT_CONFIGURED', 'NETWORK_ERROR', 'REQUEST_TIMEOUT'].includes(code)) return 'offline';
  if (code === 'LOCATION_REQUIRED') return 'location';
  if (['PROVIDER_UNAVAILABLE', 'PROVIDER_TIMEOUT', 'PROVIDER_NOT_CONFIGURED'].includes(code)) return 'provider';
  return error ? 'error' : 'empty';
}

module.exports = { CITY_ANCHORS, CATEGORY_GROUPS, SEARCH_CATEGORY_TERMS, resolveDiscoverContext, categoryForSearch, recognizedSearchCategory, providerTrust, resultProvenance, normalizeDiscoverResult, stateForFailure, hasCoordinates };
