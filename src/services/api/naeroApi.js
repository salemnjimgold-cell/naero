import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT_MS, isRemoteApiEnabled } from '../../config/api';
import { getSupabaseClient } from '../supabase';

const AUTH_TOKEN_KEY = '@naero_api_token';
const REFRESH_RETRY_KEY = '@naero_refresh_retry';

class NaeroApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', data = null, retryable = false } = {}) {
    super(message);
    this.name = 'NaeroApiError';
    this.status = status;
    this.code = code;
    this.data = data;
    this.retryable = retryable;
  }
}

function normalizePath(path) {
  return path.startsWith('/') ? path : `/${path}`;
}

function isRetryable(status) {
  return status === 0 || status >= 500 || status === 429;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createNaeroApiClient({ baseUrl = API_BASE_URL, timeoutMs = API_TIMEOUT_MS, fetchImpl = fetch } = {}) {
  let cachedToken = null;

  async function getAccessToken() {
    if (cachedToken) return cachedToken;
    const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (stored) cachedToken = stored;
    return cachedToken;
  }

  async function refreshToken() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session?.access_token) {
      cachedToken = null;
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
    const token = data.session.access_token;
    cachedToken = token;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    return token;
  }

  async function request(path, options = {}) {
    if (!isRemoteApiEnabled(baseUrl)) {
      return {
        data: null,
        error: { code: 'API_NOT_CONFIGURED', message: 'Naero API URL is not configured. Set EXPO_PUBLIC_NAERO_API_URL in .env' },
        status: 0,
      };
    }

    const maxRetries = options.retries ?? 3;
    const backoffMs = options.backoffMs ?? 1000;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs || timeoutMs);

      try {
        let token = options.authToken || await getAccessToken();

        const headers = {
          accept: 'application/json',
          ...(options.body ? { 'content-type': 'application/json' } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
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

        if (response.status === 401 && attempt < maxRetries) {
          const newToken = await refreshToken();
          if (newToken) {
            lastError = null;
            continue;
          }
          return {
            data: null,
            error: { code: 'AUTH_FAILED', message: 'Authentication failed. Please sign in again.' },
            status: 401,
          };
        }

        if (!response.ok) {
          const err = {
            code: payload?.error?.code || 'HTTP_ERROR',
            message: payload?.error?.message || response.statusText,
            status: response.status,
          };

          if (attempt < maxRetries && isRetryable(response.status)) {
            lastError = err;
            await sleep(backoffMs * Math.pow(2, attempt));
            continue;
          }

          return { data: null, error: err, status: response.status };
        }

        return {
          data: payload?.data ?? payload,
          error: null,
          status: response.status,
        };
      } catch (error) {
        const code = error.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR';
        const err = { code, message: error.message };

        if (attempt < maxRetries && code === 'NETWORK_ERROR') {
          lastError = err;
          await sleep(backoffMs * Math.pow(2, attempt));
          continue;
        }

        return {
          data: null,
          error: err,
          status: 0,
          retryable: code === 'NETWORK_ERROR',
        };
      } finally {
        clearTimeout(timeout);
      }
    }

    return {
      data: null,
      error: lastError || { code: 'MAX_RETRIES', message: 'Request failed after maximum retries.' },
      status: 0,
    };
  }

  async function setToken(token) {
    cachedToken = token;
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  async function clearToken() {
    cachedToken = null;
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  return {
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
    setToken,
    clearToken,
  };
}

export const naeroApi = createNaeroApiClient();
export { NaeroApiError };
