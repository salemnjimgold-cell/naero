import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import foundations from './foundations';
import modeCore from './themeModeCore';

const STORAGE_KEY = '@naero_theme_preference';
const ThemeModeContext = createContext(null);

export function ThemeModeProvider({ children }) {
  const systemScheme = useColorScheme() || Appearance.getColorScheme();
  const [preference, setPreferenceState] = useState('system');
  const resolvedMode = modeCore.resolveThemeMode(preference, systemScheme);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => { if (active) setPreferenceState(modeCore.normalizeThemeMode(stored)); })
      .catch(() => { if (active) setPreferenceState('system'); });
    return () => { active = false; };
  }, []);

  const setPreference = useCallback(async (next) => {
    const safe = modeCore.normalizeThemeMode(next);
    setPreferenceState(safe);
    try { await AsyncStorage.setItem(STORAGE_KEY, safe); } catch {}
    return safe;
  }, []);

  const value = useMemo(() => ({ preference, resolvedMode, theme: foundations.THEMES[resolvedMode], setPreference }), [preference, resolvedMode, setPreference]);
  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const value = useContext(ThemeModeContext);
  if (!value) throw new Error('useThemeMode must be used inside ThemeModeProvider');
  return value;
}

export { STORAGE_KEY as THEME_PREFERENCE_STORAGE_KEY };
