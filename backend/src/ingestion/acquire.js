const { createHash } = require('node:crypto');
const { buildQuery } = require('../gateway/providers/overpass');
const { getTarget } = require('./targets');
const { createManifest } = require('./manifest');

const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_ELEMENTS = 500;
const TIMEOUT_MS = 25000;

async function acquire({ city, category, fetchImpl = fetch, now = () => new Date().toISOString() }) {
  const target = getTarget(city, category);
  if (!target) throw Object.assign(new Error('Only vienna/gyor hospital targets are supported.'), { code: 'UNSUPPORTED_TARGET' });
  const query = buildQuery({ ...target, limit: 50 });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(ENDPOINT, { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': 'Naero/1.2 verified-places-ingestion contact=operations@naero.app' }, body: new URLSearchParams({ data: query }).toString(), signal: controller.signal });
    if (!response.ok) throw Object.assign(new Error('Overpass acquisition returned a non-success status.'), { code: 'UPSTREAM_HTTP_ERROR', status: response.status });
    const declaredLength = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) throw Object.assign(new Error('Overpass response exceeds the size limit.'), { code: 'RESPONSE_TOO_LARGE' });
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_RESPONSE_BYTES) throw Object.assign(new Error('Overpass response exceeds the size limit.'), { code: 'RESPONSE_TOO_LARGE' });
    let payload;
    try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw Object.assign(new Error('Overpass response is not valid JSON.'), { code: 'INVALID_JSON' }); }
    if (!Array.isArray(payload?.elements)) throw Object.assign(new Error('Overpass response has no valid elements envelope.'), { code: 'INVALID_ENVELOPE' });
    if (payload.elements.length > MAX_ELEMENTS) throw Object.assign(new Error('Overpass returned too many elements.'), { code: 'TOO_MANY_ELEMENTS' });
    return { status: response.status, manifest: createManifest({ city, category, elements: payload.elements, acquiredAt: now(), queryFingerprint: createHash('sha256').update(query).digest('hex') }) };
  } catch (error) {
    if (error?.name === 'AbortError') throw Object.assign(new Error('Overpass acquisition timed out.'), { code: 'ACQUISITION_TIMEOUT' });
    throw error;
  } finally { clearTimeout(timer); }
}

module.exports = { ENDPOINT, MAX_RESPONSE_BYTES, MAX_ELEMENTS, TIMEOUT_MS, acquire };
