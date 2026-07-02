function createStorageService(env, fetchImpl = fetch) {
  const { url, serviceRoleKey } = env.supabase;
  const configured = Boolean(url && serviceRoleKey);

  const BUCKETS = {
    AVATARS: 'avatars',
    PLACE_IMAGES: 'place-images',
    REVIEW_IMAGES: 'review-images',
    DOCUMENTS: 'documents',
  };

  async function request(method, path, options = {}) {
    if (!configured) {
      return { data: null, error: { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase admin access is not configured.' } };
    }

    const apiUrl = `${url}/storage/v1${path}`;
    const response = await fetchImpl(apiUrl, {
      method,
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        ...(method === 'POST' ? {} : { 'content-type': 'application/json' }),
        ...(options.headers || {}),
      },
      body: options.body,
    });

    const text = await response.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
    if (!response.ok) {
      return { data: null, error: { code: 'STORAGE_ERROR', status: response.status, message: typeof data === 'string' ? data : data?.message || response.statusText } };
    }
    return { data, error: null };
  }

  async function upload(bucket, path, fileBuffer, contentType) {
    return request('POST', `/object/${bucket}/${path}`, {
      body: fileBuffer,
      headers: { 'content-type': contentType, 'x-upsert': 'true' },
    });
  }

  async function download(bucket, path) {
    return request('GET', `/object/${bucket}/${path}`);
  }

  async function remove(bucket, paths) {
    return request('DELETE', `/object/${bucket}`, {
      body: JSON.stringify({ prefixes: Array.isArray(paths) ? paths : [paths] }),
    });
  }

  async function getPublicUrl(bucket, path) {
    if (!configured) return { data: null, error: { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase admin access is not configured.' } };
    return {
      data: { publicUrl: `${url}/storage/v1/object/public/${bucket}/${path}` },
      error: null,
    };
  }

  async function createSignedUrl(bucket, path, expiresInSeconds = 3600) {
    return request('POST', `/object/sign/${bucket}/${path}`, {
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });
  }

  async function createSignedUploadUrl(bucket, path, expiresInSeconds = 3600) {
    return request('POST', `/object/upload/sign/${bucket}/${path}`, {
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });
  }

  async function list(bucket, options = {}) {
    const params = new URLSearchParams();
    if (options.prefix) params.set('prefix', options.prefix);
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));
    if (options.sortBy) params.set('sortBy', JSON.stringify(options.sortBy));
    const qs = params.toString();
    return request('POST', `/object/list/${bucket}${qs ? `?${qs}` : ''}`, {
      body: JSON.stringify({ prefix: options.prefix || '', ...(options.search ? { search: options.search } : {}) }),
    });
  }

  function buildUserPath(userId, filename) {
    const timestamp = Date.now();
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${userId}/${timestamp}_${safe}`;
  }

  function buildPlacePath(placeId, filename) {
    const timestamp = Date.now();
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${placeId}/${timestamp}_${safe}`;
  }

  function buildReviewPath(reviewId, filename) {
    const timestamp = Date.now();
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${reviewId}/${timestamp}_${safe}`;
  }

  return {
    configured,
    BUCKETS,
    upload,
    download,
    remove,
    getPublicUrl,
    createSignedUrl,
    createSignedUploadUrl,
    list,
    buildUserPath,
    buildPlacePath,
    buildReviewPath,
  };
}

module.exports = { createStorageService };
