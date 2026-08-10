function createRateLimiter({ windowMs, max }) {
  const buckets = new Map();
  return {
    check(key, now = Date.now()) {
      const current = buckets.get(key);
      if (!current || now >= current.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: Math.max(0, max - 1) };
      }
      current.count += 1;
      return { allowed: current.count <= max, remaining: Math.max(0, max - current.count), resetAt: current.resetAt };
    },
    clear() { buckets.clear(); },
  };
}

module.exports = { createRateLimiter };
