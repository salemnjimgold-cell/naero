const TARGETS = Object.freeze({
  vienna: Object.freeze({ city: 'Vienna', countryCode: 'AT', category: 'hospital', latitude: 48.2082, longitude: 16.3738, radius: 15000 }),
  gyor: Object.freeze({ city: 'Győr', countryCode: 'HU', category: 'hospital', latitude: 47.6875, longitude: 17.6504, radius: 15000 }),
});

function getTarget(city, category) {
  if (typeof city !== 'string' || typeof category !== 'string') return null;
  const target = TARGETS[city];
  return target?.category === category ? target : null;
}

module.exports = { TARGETS, getTarget };
