const TRUST_PRESENTATION = Object.freeze({
  official: Object.freeze({ icon: 'business-outline', tone: 'official', borderWidth: 2, borderStyle: 'solid' }),
  naero_verified: Object.freeze({ icon: 'shield-checkmark-outline', tone: 'verified', borderWidth: 1, borderStyle: 'solid' }),
  external_provider: Object.freeze({ icon: 'open-outline', tone: 'external', borderWidth: 1, borderStyle: 'solid' }),
  community: Object.freeze({ icon: 'people-outline', tone: 'community', borderWidth: 1, borderStyle: 'solid' }),
  ai_guidance: Object.freeze({ icon: 'sparkles-outline', tone: 'ai', borderWidth: 1, borderStyle: 'dashed' }),
});
module.exports = { TRUST_PRESENTATION };
