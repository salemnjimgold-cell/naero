const { createOpenAIProvider } = require('./openai');
const { createGeminiProvider } = require('./gemini');
const { createClaudeProvider } = require('./claude');

const PROVIDER_REGISTRY = {
  openai: { factory: createOpenAIProvider, name: 'openai' },
  gemini: { factory: createGeminiProvider, name: 'gemini' },
  claude: { factory: createClaudeProvider, name: 'claude' },
};

function createProviderFactory(env) {
  function getProvider(name) {
    const entry = PROVIDER_REGISTRY[name];
    if (!entry) return null;
    return entry.factory(env);
  }

  function getConfiguredProviders() {
    const available = [];
    for (const [name, entry] of Object.entries(PROVIDER_REGISTRY)) {
      const provider = entry.factory(env);
      if (provider.configured) {
        available.push(provider);
      }
    }
    return available;
  }

  function getDefaultProvider() {
    const preferred = env.ai?.provider || 'openai';
    const provider = getProvider(preferred);
    if (provider && provider.configured) return provider;

    const available = getConfiguredProviders();
    return available.length > 0 ? available[0] : null;
  }

  return {
    getProvider,
    getConfiguredProviders,
    getDefaultProvider,
    registry: Object.keys(PROVIDER_REGISTRY),
  };
}

module.exports = { createProviderFactory, PROVIDER_REGISTRY };
