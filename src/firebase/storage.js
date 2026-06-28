import { isFirebaseConfigured } from './config';

let storage = null;

export function getStorage() {
  if (!isFirebaseConfigured()) return null;
  return storage;
}

export function isStorageReady() {
  return !!(isFirebaseConfigured() && storage);
}

export async function uploadImage(uri, path) {
  return { url: null, error: 'Firebase storage not configured' };
}

export async function deleteFile(path) {
  return { success: false, error: 'Firebase storage not configured' };
}
