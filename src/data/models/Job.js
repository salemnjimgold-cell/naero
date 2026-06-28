export class Job {
  constructor({
    id, title, company, type, location, city, country = 'Hungary',
    salary, description, requirements = [], tags = [],
    languages = [], workPermitRequired = true, contactLink = null,
    postedDate, expiresAt = null, verified = false, source = 'company',
    lastUpdated = new Date().toISOString(), demo = true,
  } = {}) {
    this.id = id;
    this.title = title;
    this.company = company;
    this.type = type;
    this.location = location;
    this.city = city;
    this.country = country;
    this.salary = salary;
    this.description = description;
    this.requirements = requirements;
    this.tags = tags;
    this.languages = languages;
    this.workPermitRequired = workPermitRequired;
    this.contactLink = contactLink;
    this.postedDate = postedDate;
    this.expiresAt = expiresAt;
    this.verified = verified;
    this.source = source;
    this.lastUpdated = lastUpdated;
    this.demo = demo;
  }

  toFirestore() {
    return { ...this };
  }

  static fromFirestore(id, data) {
    return new Job({ id, ...data });
  }

  static types = {
    'full-time': { icon: 'briefcase', label: 'Full Time' },
    'part-time': { icon: 'time', label: 'Part Time' },
    freelance: { icon: 'laptop', label: 'Freelance' },
    internship: { icon: 'school', label: 'Internship' },
    volunteer: { icon: 'heart', label: 'Volunteer' },
    contract: { icon: 'document-text', label: 'Contract' },
    seasonal: { icon: 'calendar', label: 'Seasonal' },
  };
}
