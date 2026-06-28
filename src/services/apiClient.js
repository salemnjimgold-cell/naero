import { API_BASE_URL, API_TIMEOUT_MS, isRemoteApiEnabled } from '../config/api';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

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
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || timeoutMs);

    try {
      const headers = {
        accept: 'application/json',
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.authToken ? { authorization: `Bearer ${options.authToken}` } : {}),
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
      };
    } catch (error) {
      const code = error.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR';
      return {
        data: null,
        error: { code, message: error.message },
        status: 0,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  };
}

export const apiClient = createApiClient();
