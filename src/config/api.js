export const API_BASE_URL = process.env.EXPO_PUBLIC_NAERO_API_URL || '';
export const API_TIMEOUT_MS = 10000;

export function isRemoteApiEnabled(baseUrl = API_BASE_URL) {
  return Boolean(baseUrl && /^https?:\/\//i.test(baseUrl));
}
