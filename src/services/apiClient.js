import { API_BASE_URL, API_TIMEOUT_MS, isRemoteApiEnabled } from '../config/api';
const { ApiError, normalizeApiFailure, createRequestId } = require('./apiClientCore');

export { ApiError };

function normalizePath(path) {
  return path.startsWith('/') ? path : `/${path}`;
}

export function createApiClient({ baseUrl = API_BASE_URL, timeoutMs = API_TIMEOUT_MS, fetchImpl = fetch } = {}) {
  async function request(path, options = {}) {
    if (!isRemoteApiEnabled(baseUrl)) {
      return {
        data: null,
        error: { code: 'API_NOT_CONFIGURED', message: 'Naero API is not configured.' },
        status: 0,
      };
    }

    const controller = new AbortController();
    let didTimeout = false;
    const timeout = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, options.timeoutMs || timeoutMs);
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener?.('abort', abortFromCaller, { once: true });
    const requestId = options.requestId || createRequestId();

    try {
      const headers = {
        accept: 'application/json',
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.authToken ? { authorization: `Bearer ${options.authToken}` } : {}),
        'x-request-id': requestId,
        ...(options.headers || {}),
      };

      const response = await fetchImpl(`${baseUrl}${normalizePath(path)}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;

      if (!response.ok) {
        return {
          data: null,
          error: payload?.error || { code: 'HTTP_ERROR', message: response.statusText },
          status: response.status,
        };
      }

      return {
        data: payload?.data ?? payload,
        error: null,
        status: response.status,
        meta: payload?.meta || null,
        requestId: response.headers?.get?.('x-request-id') || payload?.meta?.requestId || requestId,
      };
    } catch (error) {
      const normalized = normalizeApiFailure(error);
      return {
        data: null,
        error: {
          ...normalized,
          code: didTimeout ? 'REQUEST_TIMEOUT' : (options.signal?.aborted ? 'REQUEST_CANCELLED' : normalized.code),
        },
        status: 0,
        requestId,
      };
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener?.('abort', abortFromCaller);
    }
  }

  return {
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  };
}

export const apiClient = createApiClient();
