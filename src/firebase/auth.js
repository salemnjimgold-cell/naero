import { isFirebaseConfigured, getFirebaseApp } from './config';
import {
  signInAsGuest as signInAsGuestSession,
  signInWithEmail as signInWithEmailSession,
  createAccount as createAccountSession,
  signOut as signOutSession,
} from '../services/authService';

let firebaseAuth = null;

export function getAuth() {
  if (!isFirebaseConfigured()) return null;
  if (firebaseAuth) return firebaseAuth;
  try {
    const app = getFirebaseApp();
    if (!app) return null;
    return null;
  } catch {
    return null;
  }
}

export function isAuthReady() {
  return !!(isFirebaseConfigured() && firebaseAuth);
}

export async function signInAnonymously() {
  const result = await signInAsGuestSession();
  return { user: result.user, error: result.error };
}

export async function signInWithEmail(email, password) {
  if (!isFirebaseConfigured()) {
    return signInWithEmailSession(email, password);
  }
  return { user: null, error: 'Firebase not configured' };
}

export async function createAccount(email, password) {
  if (!isFirebaseConfigured()) {
    return createAccountSession(email, password);
  }
  return { user: null, error: 'Firebase not configured' };
}

export async function signOut() {
  return signOutSession();
}
