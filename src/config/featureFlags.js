import Constants from 'expo-constants';
import core from './featureFlagsCore';

const expoOverrides = Constants.expoConfig?.extra?.featureFlags || {};
const developmentOverrides = typeof globalThis !== 'undefined' && __DEV__
  ? (globalThis.__NAERO_FEATURE_FLAGS__ || {})
  : {};

export const featureFlags = core.resolveFeatureFlags({ ...expoOverrides, ...developmentOverrides });
export const isFeatureEnabled = (name) => featureFlags[name] === true;
export const FEATURE_FLAG_DEFAULTS = core.FLAG_DEFAULTS;
