function createUploadRoutes(env, storageService) {
  const MAX_BODY = 10 * 1024 * 1024;

  async function handleUpload(req, res, url, auth, readJson) {
    if (!auth.ok) {
      return { status: auth.statusCode, body: { error: { code: auth.code, message: auth.message } } };
    }

    const bucket = url.searchParams.get('bucket');
    const userId = auth.user.id;

    if (!bucket || !storageService.BUCKETS[bucket.toUpperCase()]) {
      return { status: 400, body: { error: { code: 'INVALID_BUCKET', message: `Unknown bucket: ${bucket}` } } };
    }

    if (req.method === 'POST' && url.pathname === '/v1/uploads/signed-url') {
      const { filename, expiresIn } = await readJson(req);
      if (!filename) {
        return { status: 400, body: { error: { code: 'MISSING_FILENAME', message: 'filename is required' } } };
      }
      const path = storageService.buildUserPath(userId, filename);
      const result = await storageService.createSignedUploadUrl(bucket, path, expiresIn || 3600);
      if (result.error) {
        return { status: 502, body: { error: result.error } };
      }
      return { status: 200, body: { data: { path, signedUrl: result.data.signedUrl, token: result.data.token } } };
    }

    if (req.method === 'GET' && url.pathname === '/v1/uploads/signed-url') {
      const path = url.searchParams.get('path');
      const expiresIn = Number.parseInt(url.searchParams.get('expires_in')) || 3600;
      if (!path) {
        return { status: 400, body: { error: { code: 'MISSING_PATH', message: 'path is required' } } };
      }
      const result = await storageService.createSignedUrl(bucket, path, expiresIn);
      if (result.error) {
        return { status: 502, body: { error: result.error } };
      }
      return { status: 200, body: { data: { signedUrl: result.data.signedUrl } } };
    }

    if (req.method === 'GET' && url.pathname === '/v1/uploads/url') {
      const path = url.searchParams.get('path');
      if (!path) {
        return { status: 400, body: { error: { code: 'MISSING_PATH', message: 'path is required' } } };
      }
      const result = await storageService.getPublicUrl(bucket, path);
      if (result.error) {
        return { status: 502, body: { error: result.error } };
      }
      return { status: 200, body: { data: { publicUrl: result.data.publicUrl } } };
    }

    if (req.method === 'DELETE' && url.pathname === '/v1/uploads') {
      const path = url.searchParams.get('path');
      if (!path) {
        return { status: 400, body: { error: { code: 'MISSING_PATH', message: 'path is required' } } };
      }
      const result = await storageService.remove(bucket, path);
      if (result.error) {
        return { status: 502, body: { error: result.error } };
      }
      return { status: 200, body: { data: { removed: true } } };
    }

    return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Upload route not found.' } } };
  }

  return { handleUpload };
}

module.exports = { createUploadRoutes };
