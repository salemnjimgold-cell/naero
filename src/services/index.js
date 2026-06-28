export { DataService } from './dataService';
export { placeService } from './placeService';
export { serviceService } from './serviceService';
export { jobService } from './jobService';
export { housingService } from './housingService';
export { communityService } from './communityService';
export { safetyTipService, emergencyContactService } from './safetyService';
export { searchService } from './searchService';
export { apiClient, createApiClient, ApiError } from './apiClient';
export {
  getAuthSession,
  signInAsGuest,
  getAuthToken,
  isAuthenticated,
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
} from './locationService';

export {
  searchNearbyPlaces,
  searchCityPlaces,
  queryOverpass,
  reverseGeocode,
  searchCity,
  searchPlace,
  configureGooglePlaces,
  isGooglePlacesConfigured,
  nearbySearch,
  textSearch,
  placeDetails,
} from './api';

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
