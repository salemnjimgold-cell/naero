const PLACE_SOURCE_LINKS = Object.freeze({
  osm: Object.freeze({ label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright' }),
  geoapify: Object.freeze({ label: 'Powered by Geoapify', url: 'https://www.geoapify.com/' }),
  odbl: Object.freeze({ label: 'ODbL 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/' }),
});

function attributionLinks(attributions = []) {
  const text = attributions.filter((value) => typeof value === 'string').join(' ');
  const links = [];
  if (/OpenStreetMap/i.test(text)) links.push(PLACE_SOURCE_LINKS.osm);
  if (/Geoapify/i.test(text)) links.push(PLACE_SOURCE_LINKS.geoapify);
  return links;
}

module.exports = { PLACE_SOURCE_LINKS, attributionLinks };
