const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

let apiKey = null;

export function configureGooglePlaces(key) {
  apiKey = key;
}

export function isGooglePlacesConfigured() {
  return !!apiKey;
}

export async function nearbySearch(lat, lng, radius = 1500, type = null) {
  if (!apiKey) return { configured: false, data: [] };
  try {
    let url = `${PLACES_API_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${apiKey}`;
    if (type) url += `&type=${type}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.warn('[GooglePlaces] API error:', data.status, data.error_message);
      return { configured: true, data: [] };
    }
    return {
      configured: true,
      data: (data.results || []).map(place => ({
        id: `gplaces_${place.place_id}`,
        name: place.name,
        address: place.vicinity || '',
        city: '',
        coordinates: place.geometry?.location
          ? { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
          : null,
        rating: place.rating || null,
        userRatingsTotal: place.user_ratings_total || 0,
        types: place.types || [],
        priceLevel: place.price_level || null,
        photos: place.photos?.map(p => p.photo_reference) || [],
        source: 'google_places',
        verified: false,
        demo: false,
        lastUpdated: new Date().toISOString(),
      })),
    };
  } catch (err) {
    console.warn('[GooglePlaces] Nearby search failed:', err.message);
    return { configured: true, data: [] };
  }
}

export async function textSearch(query, lat = null, lng = null) {
  if (!apiKey) return { configured: false, data: [] };
  try {
    let url = `${PLACES_API_BASE}/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    if (lat && lng) url += `&location=${lat},${lng}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.warn('[GooglePlaces] Text search error:', data.status);
      return { configured: true, data: [] };
    }
    return {
      configured: true,
      data: (data.results || []).map(place => ({
        id: `gplaces_${place.place_id}`,
        name: place.name,
        address: place.formatted_address || '',
        city: '',
        coordinates: place.geometry?.location
          ? { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
          : null,
        rating: place.rating || null,
        types: place.types || [],
        source: 'google_places',
        verified: false,
        demo: false,
        lastUpdated: new Date().toISOString(),
      })),
    };
  } catch (err) {
    console.warn('[GooglePlaces] Text search failed:', err.message);
    return { configured: true, data: [] };
  }
}

export async function placeDetails(placeId) {
  if (!apiKey) return null;
  try {
    const url = `${PLACES_API_BASE}/details/json?place_id=${placeId}&key=${apiKey}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,reviews,photos,geometry`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Places details HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OK' || !data.result) {
      console.warn('[GooglePlaces] Details error:', data.status);
      return null;
    }
    const place = data.result;
    return {
      id: `gplaces_${placeId}`,
      name: place.name,
      address: place.formatted_address || '',
      phone: place.formatted_phone_number || null,
      website: place.website || null,
      openingHours: place.opening_hours?.weekday_text || null,
      rating: place.rating || null,
      reviews: (place.reviews || []).map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.time,
      })),
      coordinates: place.geometry?.location
        ? { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
        : null,
      photos: place.photos?.map(p => p.photo_reference) || [],
      source: 'google_places',
      verified: false,
      demo: false,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[GooglePlaces] Details failed:', err.message);
    return null;
  }
}
