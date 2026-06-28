import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_PROFILE: '@naero_ai_profile',
  CHECKLIST: '@naero_ai_checklist',
  CONVERSATION: '@naero_ai_conversation',
};

export async function loadProfile() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile) {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch {}
}

export async function updateProfile(updates) {
  const current = (await loadProfile()) || {};
  const merged = { ...current, ...updates };
  await saveProfile(merged);
  return merged;
}

export async function loadChecklist() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CHECKLIST);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveChecklist(checklist) {
  try {
    await AsyncStorage.setItem(KEYS.CHECKLIST, JSON.stringify(checklist));
  } catch {}
}

export async function loadConversationHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CONVERSATION);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function appendConversationEntry(entry) {
  const history = await loadConversationHistory();
  history.push({ ...entry, timestamp: Date.now() });
  const recent = history.slice(-50);
  try {
    await AsyncStorage.setItem(KEYS.CONVERSATION, JSON.stringify(recent));
  } catch {}
  return recent;
}

export async function clearConversationHistory() {
  try {
    await AsyncStorage.removeItem(KEYS.CONVERSATION);
  } catch {}
}
