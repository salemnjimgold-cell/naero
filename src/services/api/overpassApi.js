import { getDistanceFromLatLonInKm } from '../../utils/distance';

const OSM_API = 'https://overpass-api.de/api/interpreter';

const PLACE_TAGS = {
  restaurant: '["amenity"="restaurant"]',
  cafe: '["amenity"="cafe"]',
  halalFood: '["cuisine"="halal"]',
  supermarket: '["shop"="supermarket"]',
  pharmacy: '["amenity"="pharmacy"]',
  hospital: '["amenity"="hospital"]',
  clinic: '["amenity"="clinic"]',
  bank: '["amenity"="bank"]',
  atm: '["amenity"="atm"]',
  transport: '["amenity"="bus_station"]',
  police: '["amenity"="police"]',
  fireStation: '["amenity"="fire_station"]',
  embassy: '["amenity"="embassy"]',
  communityCenter: '["amenity"="community_centre"]',
  placeOfWorship: '["amenity"="place_of_worship"]',
  school: '["amenity"="school"]',
  languageSchool: '["amenity"="language_school"]',
  library: '["amenity"="library"]',
  postOffice: '["amenity"="post_office"]',
};

export async function queryOverpass(query, timeout = 15000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(OSM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query,
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const data = await res.json();
    return data.elements || [];
  } catch (err) {
    console.warn('[Overpass] Query failed:', err.message);
    return [];
  }
}

export function buildNearbyQuery(lat, lng, radiusKm = 5, amenityTag = null) {
  const radiusM = radiusKm * 1000;
  const tagFilter = amenityTag && PLACE_TAGS[amenityTag]
    ? PLACE_TAGS[amenityTag]
    : '[~"^(amenity|shop|cuisine)$"~"."]';
  return `
    [out:json][timeout:15];
    node(around:${radiusM},${lat},${lng})${tagFilter};
    out center;
  `;
}

export function buildCityQuery(cityName, amenityTag = null) {
  const tagFilter = amenityTag && PLACE_TAGS[amenityTag]
    ? PLACE_TAGS[amenityTag]
    : '[~"^(amenity|shop|cuisine)$"~"."]';
  return `
    [out:json][timeout:15];
    area[name="${cityName}"]->.searchArea;
    node(area.searchArea)${tagFilter};
    out center;
  `;
}

export async function searchNearbyPlaces(lat, lng, radiusKm = 5, category = null) {
  const query = buildNearbyQuery(lat, lng, radiusKm, category);
  const elements = await queryOverpass(query);
  if (!elements.length) return [];
  return elements
    .filter(el => el.tags && (el.lat || el.center))
    .map(el => {
      const elLat = el.lat || el.center?.lat;
      const elLng = el.lon || el.center?.lon;
      return {
        id: `osm_${el.id}`,
        name: el.tags.name || el.tags['name:en'] || 'Unknown',
        category: _mapOsmCategory(el.tags),
        address: el.tags['addr:full'] || el.tags['addr:street'] || '',
        city: el.tags['addr:city'] || '',
        coordinates: elLat && elLng ? { latitude: elLat, longitude: elLng } : null,
        distance: elLat && elLng && lat && lng
          ? getDistanceFromLatLonInKm(lat, lng, elLat, elLng)
          : null,
        phone: el.tags.phone || el.tags['contact:phone'] || null,
        website: el.tags.website || null,
        openingHours: el.tags.opening_hours || null,
        source: 'overpass',
        verified: false,
        demo: false,
        lastUpdated: new Date().toISOString(),
        osmId: el.id,
        osmType: el.type,
        tags: el.tags,
      };
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}

export async function searchCityPlaces(cityName, category = null) {
  const query = buildCityQuery(cityName, category);
  const elements = await queryOverpass(query);
  if (!elements.length) return [];
  return elements
    .filter(el => el.tags && el.tags.name && (el.lat || el.center))
    .map(el => {
      const elLat = el.lat || el.center?.lat;
      const elLng = el.lon || el.center?.lon;
      return {
        id: `osm_${el.id}`,
        name: el.tags.name || el.tags['name:en'] || 'Unknown',
        category: _mapOsmCategory(el.tags),
        address: el.tags['addr:full'] || el.tags['addr:street'] || '',
        city: el.tags['addr:city'] || cityName,
        coordinates: elLat && elLng ? { latitude: elLat, longitude: elLng } : null,
        phone: el.tags.phone || el.tags['contact:phone'] || null,
        website: el.tags.website || null,
        openingHours: el.tags.opening_hours || null,
        source: 'overpass',
        verified: false,
        demo: false,
        lastUpdated: new Date().toISOString(),
        osmId: el.id,
        osmType: el.type,
        tags: el.tags,
      };
    });
}

function _mapOsmCategory(tags) {
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.cuisine === 'halal') return 'halalFood';
  if (tags.shop === 'supermarket') return 'supermarket';
  if (tags.amenity === 'pharmacy') return 'pharmacy';
  if (tags.amenity === 'hospital') return 'hospital';
  if (tags.amenity === 'clinic') return 'clinic';
  if (tags.amenity === 'bank') return 'bank';
  if (tags.amenity === 'atm') return 'atm';
  if (tags.amenity === 'bus_station' || tags.amenity === 'ferry_terminal') return 'transport';
  if (tags.amenity === 'police') return 'police';
  if (tags.amenity === 'fire_station') return 'fireStation';
  if (tags.amenity === 'embassy') return 'embassy';
  if (tags.amenity === 'community_centre') return 'communityCenter';
  if (tags.amenity === 'place_of_worship') return 'religious';
  if (tags.amenity === 'school' || tags.amenity === 'university') return 'education';
  if (tags.amenity === 'library') return 'library';
  if (tags.amenity === 'post_office') return 'postOffice';
  if (tags.amenity === 'language_school') return 'languageSchool';
  return 'other';
}

export { PLACE_TAGS };
