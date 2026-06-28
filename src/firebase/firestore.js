import { isFirebaseConfigured } from './config';

let db = null;

export function getFirestore() {
  if (!isFirebaseConfigured()) return null;
  return db;
}

export function isFirestoreReady() {
  return !!(isFirebaseConfigured() && db);
}

export class FirestoreCollection {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this._localData = null;
  }

  setLocalData(data) {
    this._localData = data || [];
  }

  async getAll() {
    if (isFirestoreReady()) {
      try {
        return { data: null, error: 'Firestore not yet connected', local: true };
      } catch (err) {
        return { data: null, error: err.message, local: true };
      }
    }
    return { data: this._localData || [], error: null, local: true };
  }

  async getById(id) {
    const result = await this.getAll();
    if (result.data) {
      const item = result.data.find((d) => d.id === id);
      return { data: item || null, error: item ? null : 'Not found', local: true };
    }
    return { data: null, error: 'Not found', local: true };
  }

  async query(field, operator, value) {
    const result = await this.getAll();
    if (!result.data) return { data: [], error: null, local: true };
    const filtered = result.data.filter((item) => {
      const fieldValue = item[field];
      switch (operator) {
        case '==': return fieldValue === value;
        case '!=': return fieldValue !== value;
        case '>': return fieldValue > value;
        case '<': return fieldValue < value;
        case '>=': return fieldValue >= value;
        case '<=': return fieldValue <= value;
        case 'array-contains': return Array.isArray(fieldValue) && fieldValue.includes(value);
        case 'in': return Array.isArray(value) && value.includes(fieldValue);
        default: return false;
      }
    });
    return { data: filtered, error: null, local: true };
  }

  async where(field, operator, value) {
    return this.query(field, operator, value);
  }

  async add(data) {
    if (isFirestoreReady()) {
      return { id: null, error: 'Firestore not yet connected', local: true };
    }
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return { id, error: null, local: true };
  }

  async update(id, data) {
    return { success: true, error: null, local: true };
  }

  async delete(id) {
    return { success: true, error: null, local: true };
  }
}

export function createCollection(name) {
  return new FirestoreCollection(name);
}
