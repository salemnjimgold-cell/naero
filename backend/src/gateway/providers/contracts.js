const REQUIRED_PROVIDER_METHODS = Object.freeze({
  reverseGeocoder: 'reverseGeocode',
  nearbySearch: 'searchNearby',
  placeDetails: 'getPlaceDetails',
  opportunities: 'listOpportunities',
  services: 'listVerifiedServices',
});

const NEARBY_PROVIDER_METHODS = Object.freeze([
  'searchNearby', 'getPlaceDetails', 'healthCheck', 'normalizeResult', 'mapCategory',
]);

function assertProvider(provider, kind) {
  const method = REQUIRED_PROVIDER_METHODS[kind];
  if (!method || typeof provider?.[method] !== 'function') {
    throw new TypeError(`Provider "${kind}" must implement ${method || 'a known contract'}.`);
  }
  return provider;
}

module.exports = { REQUIRED_PROVIDER_METHODS, NEARBY_PROVIDER_METHODS, assertProvider };
