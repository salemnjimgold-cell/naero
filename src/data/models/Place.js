export class Place {
  constructor({
    id, name, category, subcategory, rating, reviews, address,
    latitude, longitude, description, priceLevel, tags, image,
    hours, phone, website, city, country = 'Hungary',
    verified = false, source = 'community', lastUpdated = new Date().toISOString(),
    demo = true, isNearby = false, distance = null,
  } = {}) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.subcategory = subcategory || null;
    this.rating = rating || 0;
    this.reviews = reviews || 0;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.description = description;
    this.priceLevel = priceLevel || '$';
    this.tags = tags || [];
    this.image = image || null;
    this.hours = hours || null;
    this.phone = phone || null;
    this.website = website || null;
    this.city = city;
    this.country = country;
    this.verified = verified;
    this.source = source;
    this.lastUpdated = lastUpdated;
    this.demo = demo;
    this.isNearby = isNearby;
    this.distance = distance;
  }

  get isOpenNow() {
    return true;
  }

  toFirestore() {
    const obj = { ...this };
    delete obj.isNearby;
    delete obj.distance;
    return obj;
  }

  static fromFirestore(id, data) {
    return new Place({ id, ...data });
  }

  static categories = {
    restaurants: { icon: 'restaurant', color: '#FF6B35' },
    cafés: { icon: 'cafe', color: '#D4A574' },
    halalFood: { icon: 'fast-food', color: '#059669' },
    supermarkets: { icon: 'cart', color: '#EC4899' },
    pharmacies: { icon: 'medkit', color: '#10B981' },
    hospitals: { icon: 'medkit-outline', color: '#EF4444' },
    clinics: { icon: 'fitness', color: '#F59E0B' },
    banks: { icon: 'wallet', color: '#10B981' },
    transport: { icon: 'bus', color: '#3B82F6' },
    government: { icon: 'business', color: '#6366F1' },
    immigration: { icon: 'document-text', color: '#8B5CF6' },
    languageSchools: { icon: 'school', color: '#8B5CF6' },
    communityCenters: { icon: 'people', color: '#06B6D4' },
    religious: { icon: 'home-outline', color: '#A855F7' },
    tourist: { icon: 'compass', color: '#EC4899' },
  };
}
