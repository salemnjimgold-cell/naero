import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { I18nManager, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIEngine } from '../ai/engine';
import { loadProfile } from '../ai/memory';
import { requestLocationPermission, getCurrentPosition, getUserLocation, getLocationPermissionStatus, geocodeLocation, hasLocationPermission, refreshUserLocation } from '../services/locationService';
import {
  placeService, jobService, serviceService, housingService, communityService,
  safetyTipService, emergencyContactService,
  startBackgroundSync, stopBackgroundSync, runSync, registerSyncHandler, getLastSyncTime, isSyncInProgress,
  loadRealtimePreference, isRealtimeEnabled, setRealtimeEnabled,
  fetchLivePlacesNearby, fetchLiveCityFromCoordinates, fetchLivePlacesByCity, persistLastLocation,
} from '../services';

const AppContext = createContext();

const STORAGE_KEYS = {
  LANGUAGE: '@naero_language',
  FAVORITES: '@naero_favorites',
  SAVED_JOBS: '@naero_saved_jobs',
};

const initialState = {
  language: 'en',
  favorites: [],
  savedJobs: [],
  savedPlaces: [],
  isOnboarded: false,
  aiProfile: null,
  userLocation: null,
  locationPermissionStatus: 'undetermined',
  userCity: null,
  locationLoading: false,
  dataLoading: false,
  dataError: null,
  nearbyPlaces: [],
  nearbyServices: [],
  recentAlerts: [],
  recentJobs: [],
  syncEnabled: false,
  lastSyncTime: null,
  isSyncing: false,
  realtimeEnabled: true,
  livePlaces: [],
  livePlacesLoading: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.includes(action.payload)
          ? state.favorites.filter((id) => id !== action.payload)
          : [...state.favorites, action.payload],
      };
    case 'TOGGLE_SAVED_JOB':
      return {
        ...state,
        savedJobs: state.savedJobs.includes(action.payload)
          ? state.savedJobs.filter((id) => id !== action.payload)
          : [...state.savedJobs, action.payload],
      };
    case 'TOGGLE_SAVED_PLACE':
      return {
        ...state,
        savedPlaces: state.savedPlaces.includes(action.payload)
          ? state.savedPlaces.filter((id) => id !== action.payload)
          : [...state.savedPlaces, action.payload],
      };
    case 'SET_ONBOARDED':
      return { ...state, isOnboarded: action.payload };
    case 'SET_AI_PROFILE':
      return { ...state, aiProfile: action.payload };
    case 'SET_USER_LOCATION':
      return { ...state, userLocation: action.payload };
    case 'SET_LOCATION_PERMISSION':
      return { ...state, locationPermissionStatus: action.payload };
    case 'SET_USER_CITY':
      return { ...state, userCity: action.payload };
    case 'SET_LOCATION_LOADING':
      return { ...state, locationLoading: action.payload };
    case 'SET_DATA_LOADING':
      return { ...state, dataLoading: action.payload };
    case 'SET_DATA_ERROR':
      return { ...state, dataError: action.payload };
    case 'SET_NEARBY_PLACES':
      return { ...state, nearbyPlaces: action.payload };
    case 'SET_NEARBY_SERVICES':
      return { ...state, nearbyServices: action.payload };
    case 'SET_RECENT_ALERTS':
      return { ...state, recentAlerts: action.payload };
    case 'SET_RECENT_JOBS':
      return { ...state, recentJobs: action.payload };
    case 'SET_SYNC_ENABLED':
      return { ...state, syncEnabled: action.payload };
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    case 'SET_IS_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_REALTIME_ENABLED':
      return { ...state, realtimeEnabled: action.payload };
    case 'SET_LIVE_PLACES':
      return { ...state, livePlaces: action.payload, livePlacesLoading: false };
    case 'SET_LIVE_PLACES_LOADING':
      return { ...state, livePlacesLoading: action.payload };
    case 'LOAD_STORED':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const aiEngineRef = { current: null };

export function getAIEngine() {
  if (!aiEngineRef.current) {
    aiEngineRef.current = new AIEngine();
  }
  return aiEngineRef.current;
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const engineInit = useRef(false);

  useEffect(() => {
    loadStoredData();
    initAI();
    initSync();
    loadRealtimePref();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, state.language);
  }, [state.language]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
  }, [state.favorites]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(state.savedJobs));
  }, [state.savedJobs]);

  async function initAI() {
    if (engineInit.current) return;
    engineInit.current = true;
    const engine = getAIEngine();
    await engine.init();
    const profile = engine.getProfile();
    dispatch({ type: 'SET_AI_PROFILE', payload: profile });
  }

  async function initSync() {
    registerSyncHandler('data-cache-refresh', async () => {
      if (state.userCity) {
        await loadNearbyData(state.userCity);
      }
      return { refreshed: true };
    });
    const lastSync = await getLastSyncTime();
    if (lastSync) dispatch({ type: 'SET_LAST_SYNC_TIME', payload: lastSync });
    startBackgroundSync();
    dispatch({ type: 'SET_SYNC_ENABLED', payload: true });
  }

  async function loadRealtimePref() {
    const enabled = await loadRealtimePreference();
    dispatch({ type: 'SET_REALTIME_ENABLED', payload: enabled });
  }

  async function loadStoredData() {
    try {
      const lang = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      const favs = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      const jobs = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
      const payload = {};
      if (lang) payload.language = lang;
      if (favs) payload.favorites = JSON.parse(favs);
      if (jobs) payload.savedJobs = JSON.parse(jobs);
      if (Object.keys(payload).length) {
        dispatch({ type: 'LOAD_STORED', payload });
      }
    } catch {}
  }

  const setLanguage = useCallback((lang) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  }, []);

  const toggleFavorite = useCallback((id) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
  }, []);

  const toggleSavedJob = useCallback((id) => {
    dispatch({ type: 'TOGGLE_SAVED_JOB', payload: id });
  }, []);

  const refreshAIProfile = useCallback(async () => {
    const engine = getAIEngine();
    const profile = engine.getProfile();
    dispatch({ type: 'SET_AI_PROFILE', payload: profile });
  }, []);

  const requestLocationPermissionAction = useCallback(async () => {
    dispatch({ type: 'SET_LOCATION_LOADING', payload: true });
    const granted = await requestLocationPermission();
    if (granted) {
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: 'granted' });
      const loc = await getCurrentPosition();
      if (loc) {
        dispatch({ type: 'SET_USER_LOCATION', payload: loc });
        const city = await geocodeLocation(loc.latitude, loc.longitude);
        if (city) dispatch({ type: 'SET_USER_CITY', payload: city });
      }
    } else {
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: 'denied' });
    }
    dispatch({ type: 'SET_LOCATION_LOADING', payload: false });
  }, []);

  const refreshLocation = useCallback(async () => {
    const hasPerm = await hasLocationPermission();
    if (!hasPerm) {
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: 'denied' });
      return;
    }
    dispatch({ type: 'SET_LOCATION_LOADING', payload: true });
    const loc = await refreshUserLocation();
    if (loc) {
      dispatch({ type: 'SET_USER_LOCATION', payload: loc });
      const city = await geocodeLocation(loc.latitude, loc.longitude);
      if (city) dispatch({ type: 'SET_USER_CITY', payload: city });
    }
    dispatch({ type: 'SET_LOCATION_LOADING', payload: false });
  }, []);

  const loadNearbyData = useCallback(async (city) => {
    if (!city) return;
    dispatch({ type: 'SET_DATA_LOADING', payload: true });
    try {
      const [places, services, alerts, jobs] = await Promise.all([
        placeService.getByCity(city),
        serviceService.getByCity(city),
        communityService.getAlerts(city),
        jobService.getByCity(city),
      ]);
      if (places.data) dispatch({ type: 'SET_NEARBY_PLACES', payload: places.data });
      if (services.data) dispatch({ type: 'SET_NEARBY_SERVICES', payload: services.data });
      if (alerts.data) dispatch({ type: 'SET_RECENT_ALERTS', payload: alerts.data });
      if (jobs.data) dispatch({ type: 'SET_RECENT_JOBS', payload: jobs.data });
      dispatch({ type: 'SET_DATA_ERROR', payload: null });
    } catch (err) {
      dispatch({ type: 'SET_DATA_ERROR', payload: err.message });
    }
    dispatch({ type: 'SET_DATA_LOADING', payload: false });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const status = await getLocationPermissionStatus();
        dispatch({ type: 'SET_LOCATION_PERMISSION', payload: status });
        if (status === 'granted') {
          const loc = await getUserLocation();
          if (loc) {
            dispatch({ type: 'SET_USER_LOCATION', payload: loc });
            const city = await geocodeLocation(loc.latitude, loc.longitude);
            if (city) {
              dispatch({ type: 'SET_USER_CITY', payload: city });
            }
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (state.userCity) {
      loadNearbyData(state.userCity);
    }
  }, [state.userCity]);

  const toggleSavedPlace = useCallback((id) => {
    dispatch({ type: 'TOGGLE_SAVED_PLACE', payload: id });
  }, []);

  const triggerSync = useCallback(async () => {
    dispatch({ type: 'SET_IS_SYNCING', payload: true });
    const result = await runSync({ force: true });
    const lastSync = await getLastSyncTime();
    if (lastSync) dispatch({ type: 'SET_LAST_SYNC_TIME', payload: lastSync });
    dispatch({ type: 'SET_IS_SYNCING', payload: false });
    return result;
  }, []);

  const toggleRealtime = useCallback(async (enabled) => {
    await setRealtimeEnabled(enabled);
    dispatch({ type: 'SET_REALTIME_ENABLED', payload: enabled });
  }, []);

  const fetchLiveNearby = useCallback(async (lat, lng, radiusKm = 5, category = null) => {
    dispatch({ type: 'SET_LIVE_PLACES_LOADING', payload: true });
    try {
      const result = await fetchLivePlacesNearby(lat, lng, radiusKm, category);
      dispatch({ type: 'SET_LIVE_PLACES', payload: result.data || [] });
      if (result.data?.length) {
        const cityInfo = await fetchLiveCityFromCoordinates(lat, lng);
        if (cityInfo?.city) {
          dispatch({ type: 'SET_USER_CITY', payload: cityInfo.city });
          await persistLastLocation(lat, lng, cityInfo.city);
        }
      }
      return result;
    } catch (err) {
      dispatch({ type: 'SET_LIVE_PLACES', payload: [] });
      console.warn('[AppContext] fetchLiveNearby error:', err.message);
      return { source: 'error', data: [], error: err.message };
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      placeService.clearCache(),
      serviceService.clearCache(),
      jobService.clearCache(),
      communityService.clearCache(),
    ]);
    if (state.userCity) await loadNearbyData(state.userCity);
  }, [state.userCity, loadNearbyData]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setLanguage,
        toggleFavorite,
        toggleSavedPlace,
        toggleSavedJob,
        refreshAIProfile,
        refreshData,
        getAIEngine,
        requestLocationPermission: requestLocationPermissionAction,
        refreshLocation,
        hasLocationPermission: state.locationPermissionStatus === 'granted',
        triggerSync,
        toggleRealtime,
        fetchLiveNearby,
        placeService,
        serviceService,
        jobService,
        housingService,
        communityService,
        safetyTipService,
        emergencyContactService,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
