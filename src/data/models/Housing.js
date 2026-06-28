export class Housing {
  constructor({
    id, type, title, description, priceMin, priceMax, currency = 'EUR',
    address, latitude, longitude, city, country = 'Hungary',
    area, rooms, furnished = false, utilitiesIncluded = false,
    depositMonths = 2, minLeaseMonths = 12,
    landlord, contact, website,
    trustedArea = false, warnings = [],
    verified = false, source = 'community',
    lastUpdated = new Date().toISOString(), demo = true,
  } = {}) {
    this.id = id;
    this.type = type;
    this.title = title;
    this.description = description;
    this.priceMin = priceMin;
    this.priceMax = priceMax;
    this.currency = currency;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.city = city;
    this.country = country;
    this.area = area;
    this.rooms = rooms;
    this.furnished = furnished;
    this.utilitiesIncluded = utilitiesIncluded;
    this.depositMonths = depositMonths;
    this.minLeaseMonths = minLeaseMonths;
    this.landlord = landlord;
    this.contact = contact;
    this.website = website;
    this.trustedArea = trustedArea;
    this.warnings = warnings;
    this.verified = verified;
    this.source = source;
    this.lastUpdated = lastUpdated;
    this.demo = demo;
  }

  toFirestore() {
    return { ...this };
  }

  static fromFirestore(id, data) {
    return new Housing({ id, ...data });
  }

  static types = {
    room: { icon: 'bed', label: 'Room' },
    apartment: { icon: 'home', label: 'Apartment' },
    shelter: { icon: 'shield', label: 'Shelter' },
    temporary: { icon: 'time', label: 'Temporary' },
    shared: { icon: 'people', label: 'Shared' },
    studio: { icon: 'hammer', label: 'Studio' },
  };
}
