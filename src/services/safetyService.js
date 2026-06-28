import { DataService } from './dataService';
import { mockSafetyTips, mockEmergencyContacts } from '../data/providers/mockSafety';

class SafetyTipService extends DataService {
  constructor() {
    super('safetyTips', mockSafetyTips);
  }

  async getBySeverity(severity) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return { data: all.data.filter((t) => t.severity === severity), error: null };
  }

  async getByCategory(category) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return { data: all.data.filter((t) => t.category === category), error: null };
  }

  async getByCity(city) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return {
      data: all.data.filter(
        (t) => !t.city || t.city.toLowerCase() === city.toLowerCase()
      ),
      error: null,
    };
  }

  async getCritical() {
    return this.getBySeverity('critical');
  }
}

class EmergencyContactService extends DataService {
  constructor() {
    super('emergencyContacts', mockEmergencyContacts);
  }

  async getByCategory(category) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return { data: all.data.filter((c) => c.category === category), error: null };
  }

  async getByCity(city) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return {
      data: all.data.filter(
        (c) => !c.city || c.city.toLowerCase() === city.toLowerCase()
      ),
      error: null,
    };
  }
}

export const safetyTipService = new SafetyTipService();
export const emergencyContactService = new EmergencyContactService();
