const assert = require('node:assert/strict');
const { normalizeOsmElement } = require('../backend/src/gateway/providers/overpass');
const { normalizeResult } = require('../backend/src/gateway/nearbyCore');

const cities = [
  ['Budapest', 47.4979, 19.0402],
  ['Győr', 47.6875, 17.6504],
  ['Vienna', 48.2082, 16.3738],
  ['Tunis', 36.8065, 10.1815],
  ['Paris', 48.8566, 2.3522],
  ['Berlin', 52.52, 13.405],
  ['Rural Hungary (Hortobágy)', 47.5828, 21.1512],
];
const radius = 15000;
(async () => {
  const clauses = cities.flatMap(([, latitude, longitude]) => ['node', 'way', 'relation']
    .map((type) => `${type}["amenity"="hospital"](around:${radius},${latitude},${longitude});`));
  const query = `[out:json][timeout:60];(${clauses.join('')});out center tags 200;`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  let elements;
  try {
    const response = await fetch(process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'user-agent': 'Naero/1.2 milestone-3-city-qa contact=operations@naero.app',
      },
      body: new URLSearchParams({ data: query }).toString(),
      signal: controller.signal,
    });
    assert.equal(response.ok, true, `Overpass HTTP ${response.status}`);
    elements = (await response.json()).elements;
    assert.ok(Array.isArray(elements), 'Overpass elements must be an array.');
  } finally {
    clearTimeout(timer);
  }
  let passed = 0;
  for (const [city, latitude, longitude] of cities) {
    const params = { latitude, longitude, radius, limit: 10, category: 'hospital', language: 'en' };
    try {
      const items = elements
        .map((element) => normalizeOsmElement(element, params))
        .map((item) => normalizeResult(item, params)).filter(Boolean).slice(0, 10);
      for (const item of items) {
        assert.ok(item.providerId, 'Provider ID is required for a real record.');
        assert.ok(item.name, 'A displayed record must have a provider name.');
        assert.ok(item.distanceMeters <= radius, 'Result crossed the requested city radius.');
        assert.equal(item.category, 'hospital');
      }
      console.log(`PASS ${city}: ${items.length} real named hospital record(s), distance range ${items.length ? `${Math.min(...items.map((i) => i.distanceMeters))}-${Math.max(...items.map((i) => i.distanceMeters))}m` : 'empty (honest)'}`);
      passed += 1;
    } catch (error) {
      console.log(`UNAVAILABLE ${city}: ${error.code || error.name}`);
    }
  }
  console.log(`Live city QA: ${passed}/${cities.length} provider checks completed`);
  if (passed !== cities.length) process.exitCode = 1;
})();
