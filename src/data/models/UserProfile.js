export class UserProfile {
  constructor({
    id = null, name = '', email = '', avatar = null,
    countryOfOrigin = '', currentCountry = 'Hungary', currentCity = '',
    languages = [], status = 'visitor',
    interests = [], savedPlaces = [], savedJobs = [],
    aiMemory = {}, createdAt = null,
    lastActive = new Date().toISOString(),
  } = {}) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.avatar = avatar;
    this.countryOfOrigin = countryOfOrigin;
    this.currentCountry = currentCountry;
    this.currentCity = currentCity;
    this.languages = languages;
    this.status = status;
    this.interests = interests;
    this.savedPlaces = savedPlaces;
    this.savedJobs = savedJobs;
    this.aiMemory = aiMemory;
    this.createdAt = createdAt || new Date().toISOString();
    this.lastActive = lastActive;
  }

  toFirestore() {
    return { ...this };
  }

  static fromFirestore(id, data) {
    return new UserProfile({ id, ...data });
  }

  static statuses = {
    tourist: { icon: 'airplane', color: '#3B82F6' },
    worker: { icon: 'briefcase', color: '#10B981' },
    student: { icon: 'school', color: '#F59E0B' },
    refugee: { icon: 'people', color: '#8B5CF6' },
    resident: { icon: 'home', color: '#06B6D4' },
    visitor: { icon: 'compass', color: '#EC4899' },
  };
}
