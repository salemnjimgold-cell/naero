import Constants from 'expo-constants';
import core from './featureFlagsCore';

const expoOverrides = Constants.expoConfig?.extra?.featureFlags || {};
const environmentOverrides = {
  newNavigation: process.env.EXPO_PUBLIC_NAERO_NEW_NAVIGATION,
  newOnboarding: process.env.EXPO_PUBLIC_NAERO_NEW_ONBOARDING,
};
const developmentOverrides = typeof globalThis !== 'undefined' && __DEV__
  ? (globalThis.__NAERO_FEATURE_FLAGS__ || {})
  : {};

export const featureFlags = core.resolveFeatureFlags({ ...expoOverrides, ...environmentOverrides, ...developmentOverrides });
export const isFeatureEnabled = (name) => featureFlags[name] === true;
export const FEATURE_FLAG_DEFAULTS = core.FLAG_DEFAULTS;
