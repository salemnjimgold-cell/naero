export class Service {
  constructor({
    id, name, category, provider, description, price, contact,
    address, latitude, longitude, hours, website, city, country = 'Hungary',
    languages = [], verified = false, source = 'community',
    lastUpdated = new Date().toISOString(), demo = true,
  } = {}) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.provider = provider;
    this.description = description;
    this.price = price || 'Free';
    this.contact = contact;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.hours = hours || null;
    this.website = website || null;
    this.city = city;
    this.country = country;
    this.languages = languages;
    this.verified = verified;
    this.source = source;
    this.lastUpdated = lastUpdated;
    this.demo = demo;
  }

  toFirestore() {
    return { ...this };
  }

  static fromFirestore(id, data) {
    return new Service({ id, ...data });
  }

  static categories = {
    legal: { icon: 'shield-checkmark', color: '#6366F1' },
    translation: { icon: 'language', color: '#8B5CF6' },
    housing: { icon: 'home', color: '#1A936F' },
    healthcare: { icon: 'medkit', color: '#EF4444' },
    education: { icon: 'school', color: '#F59E0B' },
    transport: { icon: 'car', color: '#3B82F6' },
    banking: { icon: 'wallet', color: '#10B981' },
    food: { icon: 'fast-food', color: '#FF6B35' },
    refugee: { icon: 'people', color: '#06B6D4' },
    ngo: { icon: 'heart', color: '#EC4899' },
    emergency: { icon: 'alert-circle', color: '#EF4444' },
    jobSupport: { icon: 'briefcase', color: '#0EA5E9' },
  };
}
