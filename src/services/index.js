export { DataService } from './dataService';
export { placeService } from './placeService';
export { serviceService } from './serviceService';
export { jobService } from './jobService';
export { housingService } from './housingService';
export { communityService } from './communityService';
export { safetyTipService, emergencyContactService } from './safetyService';
export { searchService } from './searchService';
export { apiClient, createApiClient, ApiError } from './apiClient';
export { naeroApi, createNaeroApiClient, NaeroApiError } from './api/naeroApi';
export { naeroAI, createNaeroAI } from './api/naeroAI';
export { naeroNotifications, createNaeroNotifications } from './api/naeroNotifications';
export { naeroRealtime, createNaeroRealtime } from './api/naeroRealtime';
export {
  getAuthSession,
  signInAsGuest,
  signInWithEmail,
  createAccount,
  signOut,
  getAuthToken,
  isAuthenticated,
  requestPasswordReset,
  onAuthStateChange,
  updateProfile,
} from './authService';
export {
  getLocalProfile,
  saveLocalProfile,
  getRemoteProfile,
  syncProfile,
} from './profileService';

export {
  requestLocationPermission,
  getCurrentPosition,
  getLocationPermissionStatus,
  getUserLocation,
  refreshUserLocation,
  geocodeLocation,
  getLastKnownCity,
  saveManualCity,
  getManualCity,
  clearLocation,
  hasLocationPermission,
  initializeLocation,
  requestForegroundLocation,
  refreshLocationState,
  reverseGeocodeLocation,
  setManualLocation,
  disableLocationUse,
  clearStoredLocationData,
  getLocationServicesEnabled,
  startSignificantLocationUpdates,
  stopSignificantLocationUpdates,
} from './locationService';

export {
  CacheService,
  globalCache,
  locationCache,
  placesCache,
  servicesCache,
  jobsCache,
  housingCache,
  communityCache,
  safetyCache,
} from './cacheService';

export {
  registerSyncHandler,
  runSync,
  scheduleSync,
  stopSync,
  startBackgroundSync,
  stopBackgroundSync,
  getLastSyncTime,
  clearSyncState,
  isSyncInProgress,
  SYNC_INTERVAL_MS,
} from './syncEngine';

export {
  isRealtimeEnabled,
  setRealtimeEnabled,
  loadRealtimePreference,
  fetchLivePlacesNearby,
  fetchLivePlacesByCity,
  fetchLiveCityFromCoordinates,
  searchLiveCities,
  persistLastLocation,
  getLastLiveLocation,
} from './realTimeService';

export {
  getSupabaseClient,
  isSupabaseConfigured,
  destroySupabaseClient,
} from './supabase';

export {
  enqueueWrite,
  getQueue,
  processQueue,
  clearQueue,
  getQueueSize,
} from './offlineQueue';

export {
  track,
  flush,
  trackScreenView,
  trackAIRequest,
  trackSearch,
  trackPlaceOpen,
  trackAuth,
  trackError,
  isAnalyticsEnabled,
  setAnalyticsEnabled,
  getCachedEvents,
  clearEvents,
} from './analyticsService';
