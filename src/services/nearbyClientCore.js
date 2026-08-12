const CATEGORY_ALIASES = Object.freeze({
  immigration: 'immigration_office',
  government: 'government_office',
  legal: 'legal_aid',
  translation: 'translator',
  hospitals: 'hospital',
  clinics: 'clinic',
  pharmacies: 'pharmacy',
  emergency: 'emergency',
  communityCenters: 'community_center',
  jobSupport: 'job_center',
  languageSchools: 'language_school',
  transport: 'public_transport',
  banks: 'bank',
  supermarkets: 'supermarket',
  halalFood: 'halal_food',
  religious: 'religious_center',
  ngo: 'ngo',
});

function gatewayCategory(category) {
  return CATEGORY_ALIASES[category] || category;
}

function createNearbyQuery({ latitude, longitude, radiusKm, limit, category, language }) {
  return new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(Math.round(radiusKm * 1000)),
    limit: String(limit),
    category: gatewayCategory(category),
    language,
  }).toString();
}

module.exports = { CATEGORY_ALIASES, gatewayCategory, createNearbyQuery };
