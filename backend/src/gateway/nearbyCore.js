const { createHash } = require('crypto');

const EARTH_RADIUS_METERS = 6371000;
function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function validCoordinates(latitude, longitude) {
  return finite(latitude) && finite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}
function distanceMeters(a, b) {
  if (!validCoordinates(a.latitude, a.longitude) || !validCoordinates(b.latitude, b.longitude)) return NaN;
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function clean(value) { return typeof value === 'string' && value.trim() ? value.trim().replace(/\s+/g, ' ') : null; }
function normalizeName(value) { return (clean(value) || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
function stableId(provider, providerId, latitude, longitude, name) {
  const key = `${provider}|${providerId || ''}|${latitude.toFixed(5)}|${longitude.toFixed(5)}|${normalizeName(name)}`;
  return `${provider}:${createHash('sha256').update(key).digest('hex').slice(0, 20)}`;
}
function safeLineage(raw) {
  const sourceRole = ['VERIFIED', 'DISCOVERED', 'LIVE'].includes(raw.sourceRole) ? raw.sourceRole : 'LIVE';
  return [{
    provider: clean(raw.provider),
    providerId: clean(raw.providerId),
    sourceRole,
    fetchedAt: clean(raw.fetchedAt),
    verifiedAt: clean(raw.lastVerifiedAt),
    attribution: clean(raw.sourceAttribution),
    licenceId: clean(raw.sourceLicence?.licenceId),
    licenceUrl: clean(raw.sourceLicence?.licenceUrl),
  }];
}
function setLineage(item, lineage) {
  Object.defineProperty(item, '_lineage', { value: lineage, enumerable: false, configurable: true });
  return item;
}
function normalizeResult(raw, context) {
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  const name = clean(raw.name);
  if (!name || !validCoordinates(latitude, longitude) || (latitude === 0 && longitude === 0)) return null;
  const distance = distanceMeters(context, { latitude, longitude });
  if (!Number.isFinite(distance) || distance > context.radius) return null;
  const result = {
    id: stableId(raw.provider, raw.providerId, latitude, longitude, name),
    provider: raw.provider,
    providerId: clean(raw.providerId),
    category: context.category,
    name,
    description: clean(raw.description),
    latitude,
    longitude,
    distanceMeters: Math.round(distance),
    address: clean(raw.address),
    city: clean(raw.city),
    region: clean(raw.region),
    countryCode: clean(raw.countryCode)?.toUpperCase() || null,
    phone: clean(raw.phone),
    website: clean(raw.website),
    openingHours: Array.isArray(raw.openingHours) ? raw.openingHours.filter((v) => clean(v)) : null,
    isOpenNow: typeof raw.isOpenNow === 'boolean' ? raw.isOpenNow : null,
    rating: finite(raw.rating) ? raw.rating : null,
    reviewCount: Number.isInteger(raw.reviewCount) && raw.reviewCount >= 0 ? raw.reviewCount : null,
    verified: raw.verified === true,
    confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'low',
    fetchedAt: raw.fetchedAt || new Date().toISOString(),
    lastVerifiedAt: raw.lastVerifiedAt || null,
    sourceAttribution: clean(raw.sourceAttribution),
    sourceLicence: raw.sourceLicence && typeof raw.sourceLicence === 'object' ? { ...raw.sourceLicence } : null,
    sourceLicences: Array.isArray(raw.sourceLicences) ? raw.sourceLicences.map((value) => ({ ...value }))
      : raw.sourceLicence && typeof raw.sourceLicence === 'object' ? [{ ...raw.sourceLicence }] : [],
    navigationUrl: clean(raw.navigationUrl),
    permanentlyClosed: raw.permanentlyClosed === true,
  };
  Object.defineProperty(result, '_providerLinks', {
    value: Array.isArray(raw.providerLinks) ? raw.providerLinks : [],
    enumerable: false,
  });
  return setLineage(result, safeLineage(raw));
}
function completeness(item) {
  return ['address', 'city', 'phone', 'website', 'openingHours', 'isOpenNow'].reduce((n, key) => n + (item[key] !== null ? 1 : 0), 0);
}
function samePlace(a, b) {
  if (a.provider === b.provider && a.providerId && a.providerId === b.providerId) return true;
  const linked = (source, target) => source.provider === 'naero'
    && source._providerLinks?.some((link) => link.provider === target.provider && link.providerId === target.providerId);
  if (linked(a, b) || linked(b, a)) return true;
  if (a.category !== b.category) return false;
  const close = distanceMeters(a, b) <= 60;
  if (!close) return false;
  const sameName = normalizeName(a.name) === normalizeName(b.name);
  const sharedContact = (a.phone && a.phone === b.phone) || (a.website && a.website === b.website);
  const sameAddress = a.address && b.address && normalizeName(a.address) === normalizeName(b.address);
  return sameName && (sharedContact || sameAddress || distanceMeters(a, b) <= 25);
}
function mergePreferred(a, b) {
  const preferred = a.verified !== b.verified
    ? (a.verified ? a : b)
    : (completeness(a) >= completeness(b) ? a : b);
  const other = preferred === a ? b : a;
  const merged = { ...other, ...preferred };
  for (const key of Object.keys(merged)) if (merged[key] === null && other[key] !== null) merged[key] = other[key];
  merged.sourceAttribution = [...new Set([a.sourceAttribution, b.sourceAttribution].filter(Boolean))].join('; ');
  merged.sourceLicence = preferred.sourceLicence || other.sourceLicence || null;
  merged.sourceLicences = [...(a.sourceLicences || []), ...(b.sourceLicences || [])].filter((entry, index, all) =>
    all.findIndex((candidate) => candidate.provider === entry.provider && candidate.licenceId === entry.licenceId) === index);
  const lineage = [...(a._lineage || []), ...(b._lineage || [])].filter((entry, index, all) =>
    all.findIndex((candidate) => candidate.provider === entry.provider && candidate.providerId === entry.providerId) === index);
  return setLineage(merged, lineage);
}
function deduplicate(items) {
  return items.reduce((result, item) => {
    const index = result.findIndex((candidate) => samePlace(candidate, item));
    if (index === -1) result.push(item); else result[index] = mergePreferred(result[index], item);
    return result;
  }, []);
}
function rank(items, providerPriority = ['naero', 'google', 'osm']) {
  const confidence = { high: 3, medium: 2, low: 1 };
  return [...items].sort((a, b) => {
    const distanceDelta = a.distanceMeters - b.distanceMeters;
    if (Math.abs(distanceDelta) > 250) return distanceDelta;
    const completenessDelta = completeness(b) - completeness(a);
    if (completenessDelta) return completenessDelta;
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    const confidenceDelta = confidence[b.confidence] - confidence[a.confidence];
    if (confidenceDelta) return confidenceDelta;
    if (a.isOpenNow !== b.isOpenNow) return a.isOpenNow === true ? -1 : b.isOpenNow === true ? 1 : 0;
    return providerPriority.indexOf(a.provider) - providerPriority.indexOf(b.provider);
  });
}

module.exports = { validCoordinates, distanceMeters, normalizeName, normalizeResult, deduplicate, rank, completeness, samePlace };
