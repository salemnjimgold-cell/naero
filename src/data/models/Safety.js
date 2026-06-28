export class SafetyTip {
  constructor({
    id, title, category, content, severity = 'info',
    city, country = 'Hungary',
    verified = true, source = 'authority',
    lastUpdated = new Date().toISOString(), demo = true,
  } = {}) {
    this.id = id;
    this.title = title;
    this.category = category;
    this.content = content;
    this.severity = severity;
    this.city = city || null;
    this.country = country;
    this.verified = verified;
    this.source = source;
    this.lastUpdated = lastUpdated;
    this.demo = demo;
  }

  toFirestore() {
    return { ...this };
  }

  static fromFirestore(id, data) {
    return new SafetyTip({ id, ...data });
  }

  static severityConfig = {
    critical: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', icon: 'alert-circle' },
    important: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', icon: 'warning' },
    info: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', icon: 'information-circle' },
  };

  static categories = {
    emergency: { icon: 'call', label: 'Emergency Numbers' },
    transportTips: { icon: 'bus', label: 'Transport Safety' },
    localLaws: { icon: 'shield', label: 'Know Your Rights' },
    healthTips: { icon: 'medkit', label: 'Healthcare Access' },
    scamAlert: { icon: 'warning', label: 'Scam Alerts' },
    safePlaces: { icon: 'home', label: 'Safe Places' },
    winterSafety: { icon: 'snow', label: 'Winter Safety' },
    police: { icon: 'shield', label: 'Police' },
    ambulance: { icon: 'medkit', label: 'Ambulance' },
    shelter: { icon: 'home', label: 'Shelters' },
  };
}

export class EmergencyContact {
  constructor({
    id, name, number, icon = 'call', category = 'general',
    city, country = 'Hungary', language = 'English',
  } = {}) {
    this.id = id;
    this.name = name;
    this.number = number;
    this.icon = icon;
    this.category = category;
    this.city = city || null;
    this.country = country;
    this.language = language;
  }
}
