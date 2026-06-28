const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export async function reverseGeocode(lat, lng) {
  try {
    const url = `${NOMINATIM_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NaeroApp/1.0' },
    });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.error) return null;
    return {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || '',
      country: data.address?.country || '',
      displayName: data.display_name || '',
      cityDistrict: data.address?.city_district || '',
      state: data.address?.state || '',
      postcode: data.address?.postcode || '',
      coordinates: { latitude: lat, longitude: lng },
    };
  } catch (err) {
    console.warn('[Nominatim] Reverse geocode failed:', err.message);
    return null;
  }
}

export async function searchCity(query, limit = 5) {
  try {
    const url = `${NOMINATIM_URL}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${limit}&featureType=city&accept-language=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NaeroApp/1.0' },
    });
    if (!res.ok) throw new Error(`Nominatim search HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.length) return [];
    return data.map(item => ({
      id: item.osm_id?.toString() || item.place_id?.toString(),
      name: item.display_name?.split(',')[0] || item.name || '',
      fullAddress: item.display_name || '',
      city: item.address?.city || item.address?.town || item.address?.village || '',
      country: item.address?.country || '',
      coordinates: item.lat && item.lon
        ? { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) }
        : null,
      type: item.type || 'city',
      importance: item.importance || 0,
    }));
  } catch (err) {
    console.warn('[Nominatim] Search failed:', err.message);
    return [];
  }
}

export async function searchPlace(query, limit = 5) {
  try {
    const url = `${NOMINATIM_URL}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${limit}&accept-language=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NaeroApp/1.0' },
    });
    if (!res.ok) throw new Error(`Nominatim search HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.length) return [];
    return data.map(item => ({
      id: `nom_${item.osm_id || item.place_id}`,
      name: item.display_name?.split(',')[0] || item.name || '',
      address: item.display_name || '',
      city: item.address?.city || item.address?.town || item.address?.village || '',
      country: item.address?.country || '',
      coordinates: item.lat && item.lon
        ? { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) }
        : null,
      type: item.type || 'place',
      category: item.type,
      source: 'nominatim',
      verified: false,
      demo: false,
      lastUpdated: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[Nominatim] Place search failed:', err.message);
    return [];
  }
}
