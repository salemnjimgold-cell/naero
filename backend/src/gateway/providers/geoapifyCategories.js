const GEOAPIFY_CATEGORY_TIERS = Object.freeze({
  STRONG: 'strong_generic_discovery',
  VALIDATE: 'discovery_candidate_requires_validation',
  CURATED: 'naero_curated_specialized',
});

const GEOAPIFY_CATEGORY_MAP = Object.freeze({
  immigration_office: { tier: GEOAPIFY_CATEGORY_TIERS.CURATED, categories: [] },
  government_office: { tier: GEOAPIFY_CATEGORY_TIERS.CURATED, categories: [] },
  legal_aid: { tier: GEOAPIFY_CATEGORY_TIERS.CURATED, categories: [] },
  ngo: { tier: GEOAPIFY_CATEGORY_TIERS.CURATED, categories: [] },
  translator: { tier: GEOAPIFY_CATEGORY_TIERS.CURATED, categories: [] },
  hospital: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['healthcare.hospital'] },
  clinic: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['healthcare.clinic_or_praxis'] },
  pharmacy: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['healthcare.pharmacy'] },
  police: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['service.police'] },
  emergency: { tier: GEOAPIFY_CATEGORY_TIERS.CURATED, categories: [] },
  shelter: { tier: GEOAPIFY_CATEGORY_TIERS.CURATED, categories: [] },
  community_center: { tier: GEOAPIFY_CATEGORY_TIERS.VALIDATE, categories: ['activity.community_center'] },
  job_center: { tier: GEOAPIFY_CATEGORY_TIERS.CURATED, categories: [] },
  school: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['education.school'] },
  language_school: { tier: GEOAPIFY_CATEGORY_TIERS.VALIDATE, categories: ['education.language_school'] },
  public_transport: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['public_transport'] },
  bank: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['service.financial.bank'] },
  atm: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['service.financial.atm'] },
  post_office: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['service.post.office'] },
  supermarket: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['commercial.supermarket'] },
  halal_food: { tier: GEOAPIFY_CATEGORY_TIERS.VALIDATE, categories: ['catering'], conditions: ['halal'] },
  religious_center: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['religion.place_of_worship'] },
  childcare: { tier: GEOAPIFY_CATEGORY_TIERS.STRONG, categories: ['childcare'] },
  social_services: { tier: GEOAPIFY_CATEGORY_TIERS.VALIDATE, categories: ['service.social_facility'] },
});

function getGeoapifyCategory(key) { return GEOAPIFY_CATEGORY_MAP[key] || null; }
function supportsGeoapifyCategory(key) { return Boolean(getGeoapifyCategory(key)?.categories.length); }

module.exports = { GEOAPIFY_CATEGORY_TIERS, GEOAPIFY_CATEGORY_MAP, getGeoapifyCategory, supportsGeoapifyCategory };
