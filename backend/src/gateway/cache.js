function createNearbyCache({ ttlMs, staleMs }) {
  const entries = new Map();
  function key(params) {
    return [
      Math.round(params.latitude * 100) / 100,
      Math.round(params.longitude * 100) / 100,
      params.category, params.radius, params.language, params.limit,
    ].join('|');
  }
  return {
    key,
    get(params, { allowStale = false, now = Date.now() } = {}) {
      const entry = entries.get(key(params));
      if (!entry) return null;
      const ageMs = now - entry.createdAt;
      if (ageMs <= ttlMs) return { ...entry, stale: false, ageMs };
      if (allowStale && ageMs <= ttlMs + staleMs) return { ...entry, stale: true, ageMs };
      if (ageMs > ttlMs + staleMs) entries.delete(key(params));
      return null;
    },
    set(params, value, now = Date.now()) { entries.set(key(params), { value, createdAt: now }); },
    clear() { entries.clear(); },
  };
}
module.exports = { createNearbyCache };
