const FIREBASE_CONFIG = {
  apiKey: null,
  authDomain: null,
  projectId: null,
  storageBucket: null,
  messagingSenderId: null,
  appId: null,
};

let firebaseApp = null;

export function getFirebaseConfig() {
  return FIREBASE_CONFIG;
}

export function isFirebaseConfigured() {
  return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}

export function setFirebaseConfig(config) {
  Object.assign(FIREBASE_CONFIG, config);
}

export function getFirebaseApp() {
  return firebaseApp;
}

export function setFirebaseApp(app) {
  firebaseApp = app;
}

export { firebaseApp };
