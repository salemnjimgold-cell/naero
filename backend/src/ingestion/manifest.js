const { createHash } = require('node:crypto');
const { distanceMeters, normalizeName, validCoordinates } = require('../gateway/nearbyCore');
const { getTarget } = require('./targets');

const SCHEMA_VERSION = 1;
const SOURCE = Object.freeze({ id: 'osm-overpass', provider: 'osm', attribution: '© OpenStreetMap contributors', licence: 'ODbL-1.0', licenceUrl: 'https://opendatacommons.org/licenses/odbl/1-0/', copyrightUrl: 'https://www.openstreetmap.org/copyright' });
const ALLOWED_FIELDS = new Set(['name', 'description', 'organizationName', 'address', 'city', 'district', 'region', 'postalCode', 'countryCode', 'phone', 'email', 'website', 'openingHours', 'accessibility']);

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function digestContent(manifest) {
  const copy = { ...manifest };
  delete copy.acquiredAt;
  delete copy.digest;
  return createHash('sha256').update(stableStringify(copy)).digest('hex');
}
function clean(value, max = 500) {
  return typeof value === 'string' && value.trim() ? value.trim().replace(/\s+/g, ' ').slice(0, max) : null;
}
function address(tags) {
  if (!tags['addr:street'] && !tags['addr:housenumber']) return null;
  return [tags['addr:street'], tags['addr:housenumber'], tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ');
}
function typeRank(type) { return { relation: 3, way: 2, node: 1 }[type] || 0; }
function completeness(candidate) { return Object.values(candidate.fields).filter((value) => value !== null && value !== undefined).length; }
function canonicalRef(element) { return `${element.type}/${element.id}`; }
function fieldProvenance(fields) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null && value !== undefined).map(([key]) => [key, key === 'city' || key === 'countryCode' ? 'target_context' : 'osm_tag']));
}
function normalizeElement(element, target) {
  const tags = element?.tags && typeof element.tags === 'object' ? element.tags : {};
  const latitude = Number(element?.lat ?? element?.center?.lat);
  const longitude = Number(element?.lon ?? element?.center?.lon);
  const providerId = /^(node|way|relation)$/.test(element?.type) && Number.isSafeInteger(element?.id) && element.id > 0 ? canonicalRef(element) : null;
  const name = clean(tags.name || tags['name:en'], 200);
  const semantics = tags.amenity === 'hospital';
  let reasonCode = null;
  if (!providerId) reasonCode = 'INVALID_PROVIDER_ID';
  else if (!semantics) reasonCode = 'WRONG_CATEGORY';
  else if (!name) reasonCode = 'MISSING_NAME';
  else if (!validCoordinates(latitude, longitude) || (latitude === 0 && longitude === 0)) reasonCode = 'INVALID_COORDINATES';
  else if (distanceMeters(target, { latitude, longitude }) > target.radius) reasonCode = 'OUTSIDE_BOUNDARY';
  else if (tags['addr:country'] && String(tags['addr:country']).toUpperCase() !== target.countryCode) reasonCode = 'WRONG_COUNTRY';
  const fields = {
    name, description: clean(tags.description, 1000), organizationName: clean(tags.operator, 200),
    address: clean(address(tags), 500), city: clean(tags['addr:city'], 100) || target.city,
    district: clean(tags['addr:district'], 100), region: clean(tags['addr:state'], 100), postalCode: clean(tags['addr:postcode'], 20), countryCode: target.countryCode,
    phone: clean(tags.phone || tags['contact:phone'], 100), email: clean(tags.email || tags['contact:email'], 254), website: clean(tags.website || tags['contact:website'], 500),
    openingHours: clean(tags.opening_hours, 500), accessibility: clean(tags.wheelchair, 30),
  };
  return {
    provider: 'osm', providerId, sourceReference: providerId ? `https://www.openstreetmap.org/${providerId}` : null,
    category: 'hospital', latitude, longitude, fields, fieldProvenance: fieldProvenance(fields),
    classification: reasonCode ? 'rejected' : 'accepted', reasonCode,
    duplicateOf: null, elementType: element?.type || null,
  };
}
function sameHospital(a, b) {
  if (a.providerId === b.providerId) return true;
  if (a.classification === 'rejected' || b.classification === 'rejected') return false;
  const distance = distanceMeters(a, b);
  const sameName = normalizeName(a.fields.name) === normalizeName(b.fields.name);
  const sameAddress = a.fields.address && b.fields.address && normalizeName(a.fields.address) === normalizeName(b.fields.address);
  const sharedContact = (a.fields.phone && a.fields.phone === b.fields.phone) || (a.fields.website && a.fields.website === b.fields.website);
  return sameName && distance <= 60 && (sameAddress || sharedContact || distance <= 25);
}
function classify(candidates) {
  const ordered = [...candidates].sort((a, b) => (a.providerId || '').localeCompare(b.providerId || '') || stableStringify(a).localeCompare(stableStringify(b)));
  for (let index = 0; index < ordered.length; index += 1) {
    const item = ordered[index];
    if (item.classification === 'rejected') continue;
    const matches = ordered.slice(0, index).filter((candidate) => sameHospital(candidate, item) && candidate.classification !== 'rejected');
    if (!matches.length) {
      const possible = ordered.slice(0, index).find((candidate) => candidate.classification === 'accepted'
        && candidate.category === item.category
        && normalizeName(candidate.fields.name) === normalizeName(item.fields.name)
        && distanceMeters(candidate, item) <= 60);
      if (possible) { item.classification = 'ambiguous'; item.reasonCode = 'POSSIBLE_SAME_HOSPITAL'; item.duplicateOf = possible.providerId; }
      continue;
    }
    const group = [...matches, item].sort((a, b) => completeness(b) - completeness(a) || typeRank(b.elementType) - typeRank(a.elementType) || a.providerId.localeCompare(b.providerId));
    const winner = group[0];
    for (const candidate of group) {
      if (candidate === winner) continue;
      candidate.classification = 'duplicate'; candidate.reasonCode = 'SAME_HOSPITAL_EVIDENCE'; candidate.duplicateOf = winner.providerId;
    }
    winner.classification = 'accepted'; winner.reasonCode = null; winner.duplicateOf = null;
  }
  return ordered;
}
function createManifest({ city, category, elements, acquiredAt, queryFingerprint }) {
  const target = getTarget(city, category);
  if (!target) throw Object.assign(new Error('Unsupported fixed acquisition target.'), { code: 'UNSUPPORTED_TARGET' });
  if (!Array.isArray(elements)) throw Object.assign(new Error('Invalid Overpass elements envelope.'), { code: 'INVALID_ENVELOPE' });
  const candidates = classify(elements.map((element) => normalizeElement(element, target)));
  const counts = ['accepted', 'rejected', 'duplicate', 'ambiguous'].reduce((result, key) => ({ ...result, [key]: candidates.filter((item) => item.classification === key).length }), { raw: elements.length, normalized: candidates.length });
  const manifest = { schemaVersion: SCHEMA_VERSION, source: SOURCE, target: { id: city, ...target }, acquiredAt, queryFingerprint, candidates, counts };
  manifest.digest = digestContent(manifest);
  return manifest;
}
function validateManifest(manifest) {
  const fail = (code) => ({ valid: false, code });
  if (!manifest || manifest.schemaVersion !== SCHEMA_VERSION) return fail('INVALID_SCHEMA_VERSION');
  const target = getTarget(manifest.target?.id, manifest.target?.category);
  if (!target || stableStringify(manifest.target) !== stableStringify({ id: manifest.target.id, ...target })) return fail('INVALID_TARGET');
  if (stableStringify(manifest.source) !== stableStringify(SOURCE)) return fail('INVALID_SOURCE');
  if (!/^[a-f0-9]{64}$/.test(manifest.queryFingerprint || '')) return fail('INVALID_QUERY_FINGERPRINT');
  if (digestContent(manifest) !== manifest.digest) return fail('DIGEST_MISMATCH');
  if (!Array.isArray(manifest.candidates)) return fail('INVALID_CANDIDATES');
  const ids = new Set();
  for (const item of manifest.candidates) {
    if (!/^osm$/.test(item.provider) || !/^(node|way|relation)\/\d+$/.test(item.providerId || '')) return fail('INVALID_PROVIDER_ID');
    if (ids.has(item.providerId) && !(item.classification === 'duplicate' && item.duplicateOf === item.providerId)) return fail('DUPLICATE_PROVIDER_ID'); ids.add(item.providerId);
    if (!['accepted', 'rejected', 'duplicate', 'ambiguous'].includes(item.classification)) return fail('INVALID_CLASSIFICATION');
    if (!validCoordinates(item.latitude, item.longitude)) return fail('INVALID_COORDINATES');
    if (distanceMeters(target, item) > target.radius && item.reasonCode !== 'OUTSIDE_BOUNDARY') return fail('INVALID_BOUNDARY_DECISION');
    if (item.category !== 'hospital' || item.fields?.countryCode !== target.countryCode) return fail('INVALID_SEMANTICS');
    if (Object.keys(item.fields || {}).some((key) => !ALLOWED_FIELDS.has(key))) return fail('FORBIDDEN_FIELD');
    if (item.fields.rating !== undefined || item.fields.isOpenNow !== undefined || item.fields.recommendation !== undefined) return fail('FORBIDDEN_INFERENCE');
    if ((item.classification === 'duplicate' || item.classification === 'ambiguous') && (!item.duplicateOf || !ids.has(item.duplicateOf))) return fail('INVALID_DUPLICATE');
  }
  return { valid: true, code: 'VALID' };
}

module.exports = { SCHEMA_VERSION, SOURCE, stableStringify, digestContent, normalizeElement, createManifest, validateManifest };
