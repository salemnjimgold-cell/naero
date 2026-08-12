const CATEGORY_REGISTRY = Object.freeze({
  immigration_office: { google: ['government_office'], osm: [['office', 'government'], ['government', 'immigration']], confidence: 'medium' },
  government_office: { google: ['government_office'], osm: [['office', 'government']], confidence: 'high' },
  legal_aid: { google: ['lawyer'], osm: [['office', 'lawyer'], ['social_facility', 'outreach']], confidence: 'medium' },
  ngo: { google: [], osm: [['office', 'ngo'], ['office', 'association']], confidence: 'medium' },
  translator: { google: [], osm: [['office', 'translator']], confidence: 'high' },
  hospital: { google: ['hospital'], osm: [['amenity', 'hospital']], confidence: 'high' },
  clinic: { google: ['medical_clinic'], osm: [['amenity', 'clinic']], confidence: 'high' },
  pharmacy: { google: ['pharmacy'], osm: [['amenity', 'pharmacy']], confidence: 'high' },
  police: { google: ['police'], osm: [['amenity', 'police']], confidence: 'high' },
  emergency: { google: ['hospital'], osm: [['emergency', 'yes'], ['emergency', 'ambulance_station']], confidence: 'medium' },
  shelter: { google: [], osm: [['amenity', 'shelter'], ['social_facility', 'shelter']], confidence: 'medium' },
  community_center: { google: ['community_center'], osm: [['amenity', 'community_centre']], confidence: 'high' },
  job_center: { google: ['employment_agency'], osm: [['office', 'employment_agency'], ['social_facility', 'employment']], confidence: 'medium' },
  school: { google: ['school'], osm: [['amenity', 'school']], confidence: 'high' },
  language_school: { google: ['school'], osm: [['amenity', 'language_school'], ['training', 'language']], confidence: 'medium' },
  public_transport: { google: ['transit_station', 'bus_station', 'train_station'], osm: [['public_transport', 'station'], ['amenity', 'bus_station'], ['railway', 'station']], confidence: 'high' },
  bank: { google: ['bank'], osm: [['amenity', 'bank']], confidence: 'high' },
  atm: { google: ['atm'], osm: [['amenity', 'atm']], confidence: 'high' },
  post_office: { google: ['post_office'], osm: [['amenity', 'post_office']], confidence: 'high' },
  supermarket: { google: ['supermarket'], osm: [['shop', 'supermarket']], confidence: 'high' },
  halal_food: { google: ['halal_restaurant'], osm: [['diet:halal', 'yes'], ['cuisine', 'halal']], confidence: 'medium' },
  religious_center: { google: ['church', 'mosque', 'synagogue', 'hindu_temple', 'buddhist_temple'], osm: [['amenity', 'place_of_worship']], confidence: 'high' },
  childcare: { google: ['child_care_agency'], osm: [['amenity', 'childcare']], confidence: 'high' },
  social_services: { google: [], osm: [['office', 'social_services'], ['social_facility', 'service']], confidence: 'medium' },
});

function getCategory(key) {
  return CATEGORY_REGISTRY[key] || null;
}

module.exports = { CATEGORY_REGISTRY, getCategory };
