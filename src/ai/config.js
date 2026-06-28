const GEMINI_API_KEY = '';

export function getGeminiApiKey() {
  return GEMINI_API_KEY;
}

export function hasGeminiApiKey() {
  return GEMINI_API_KEY.length > 10;
}
