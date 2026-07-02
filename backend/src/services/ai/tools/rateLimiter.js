function createRateLimiter(options = {}) {
  const maxPerMinute = options.maxPerMinute || 60;
  const windowMs = 60_000;
  const buckets = new Map();

  function getKey(userId, toolName) {
    return `${userId || 'anonymous'}:${toolName}`;
  }

  function check(userId, toolName) {
    const key = getKey(userId, toolName);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart > windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: maxPerMinute - 1, resetMs: windowMs };
    }

    bucket.count += 1;
    const remaining = maxPerMinute - bucket.count;

    if (bucket.count > maxPerMinute) {
      return { allowed: false, remaining: 0, resetMs: windowMs - (now - bucket.windowStart) };
    }

    return { allowed: true, remaining, resetMs: windowMs - (now - bucket.windowStart) };
  }

  function reset(userId, toolName) {
    const key = getKey(userId, toolName);
    buckets.delete(key);
  }

  function getAllCounts() {
    const result = {};
    for (const [key, bucket] of buckets) {
      result[key] = bucket.count;
    }
    return result;
  }

  return { check, reset, getAllCounts };
}

module.exports = { createRateLimiter };
