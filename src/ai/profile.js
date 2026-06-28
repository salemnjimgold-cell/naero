import { loadProfile, saveProfile, updateProfile } from './memory';

export const PROFILE_FIELDS = [
  { key: 'name', label: 'Your name', prompt: 'What is your name?' },
  { key: 'fromCountry', label: 'From country', prompt: 'Where are you from?' },
  { key: 'toCity', label: 'City you are moving to', prompt: 'Which city are you moving to?' },
  { key: 'reason', label: 'Reason for moving', prompt: 'Are you moving for work, study, family, or asylum?' },
  { key: 'arrivalDate', label: 'When you arrived or plan to arrive', prompt: 'When did you arrive (or plan to arrive)?' },
  { key: 'languages', label: 'Languages you speak', prompt: 'What languages do you speak?' },
  { key: 'hasHousing', label: 'Do you have housing sorted?', prompt: 'Do you already have a place to live?' },
  { key: 'hasWork', label: 'Do you have a job or looking?', prompt: 'Do you already have a job or are you looking?' },
];

export function profileCompletion(profile) {
  if (!profile) return { pct: 0, missing: PROFILE_FIELDS.map((f) => f.key), isComplete: false };
  const filled = PROFILE_FIELDS.filter((f) => {
    const val = profile[f.key];
    return val !== undefined && val !== null && val !== '';
  });
  const pct = Math.round((filled.length / PROFILE_FIELDS.length) * 100);
  const missing = PROFILE_FIELDS.filter((f) => {
    const val = profile[f.key];
    return val === undefined || val === null || val === '';
  });
  return { pct, missing: missing.map((f) => f.key), isComplete: pct === 100 };
}

export function getNextMissingField(profile) {
  const { missing } = profileCompletion(profile);
  if (missing.length === 0) return null;
  return PROFILE_FIELDS.find((f) => f.key === missing[0]);
}

export function getProfileSummary(profile) {
  if (!profile) return null;
  const parts = [];
  if (profile.name) parts.push(profile.name);
  if (profile.fromCountry) parts.push('from ' + profile.fromCountry);
  if (profile.toCity) parts.push('in ' + profile.toCity);
  if (profile.reason) parts.push('(' + profile.reason + ')');
  return parts.join(' ') || null;
}

export { loadProfile, saveProfile, updateProfile };
