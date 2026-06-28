export const DATA_SCHEMA = {
  version: '1.0',
  lastUpdated: '2026-06-20',
  dataStandards: {
    everyItemMustHave: [
      'id (string, unique)',
      'verified (boolean)',
      'source (string: "authority", "ngo", "community", "company", "ai_generated")',
      'lastUpdated (ISO date string)',
      'city (string)',
      'country (string)',
      'demo (boolean)',
    ],
    qualityRules: [
      'Real data must be marked verified: true',
      'Demo/sample data must be marked demo: true',
      'Never show unverified data as confirmed',
      'Source must always be documented',
    ],
  },
  collections: {
    places: {
      description: 'All place types (restaurants, hospitals, transport, etc.)',
      indexes: ['city', 'category', 'verified', 'tags'],
      geospatial: true,
    },
    services: {
      description: 'Community services (legal, medical, translation, etc.)',
      indexes: ['city', 'category', 'verified'],
      geospatial: true,
    },
    jobs: {
      description: 'Job listings with application links',
      indexes: ['city', 'type', 'company', 'verified'],
    },
    housing: {
      description: 'Housing listings (rooms, apartments, shelters)',
      indexes: ['city', 'type', 'priceMin', 'verified'],
      geospatial: true,
    },
    communityPosts: {
      description: 'User-generated posts, questions, reviews, tips, alerts',
      indexes: ['city', 'type', 'timestamp', 'authorId'],
    },
    safetyTips: {
      description: 'Safety information, emergency contacts, scam warnings',
      indexes: ['city', 'severity', 'category'],
    },
    emergencyContacts: {
      description: 'Emergency phone numbers by city/country',
      indexes: ['city', 'category'],
    },
    userProfiles: {
      description: 'User profiles with preferences and saved items',
      indexes: ['email', 'currentCity', 'status'],
    },
    categories: {
      description: 'Dynamic categories for places, services, jobs',
      indexes: ['domain', 'active'],
    },
  },
  adminModel: {
    futureAdminFields: {
      places: ['createdBy', 'approvedBy', 'approvalDate', 'editHistory', 'active'],
      services: ['createdBy', 'approvedBy', 'approvalDate', 'editHistory', 'active'],
      jobs: ['createdBy', 'approvedBy', 'expiryDate', 'featured', 'active'],
      housing: ['createdBy', 'approvedBy', 'approvalDate', 'active'],
      communityPosts: ['pinned', 'flagged', 'hidden', 'editHistory'],
      safetyTips: ['createdBy', 'reviewedBy', 'reviewDate', 'active'],
    },
    adminRoles: ['super_admin', 'moderator', 'data_editor', 'community_manager'],
  },
  firebaseReady: {
    firestore: {
      collections: [
        'places', 'services', 'jobs', 'housing',
        'communityPosts', 'safetyTips', 'emergencyContacts',
        'userProfiles', 'categories', 'adminLogs',
      ],
      securityRules: [
        'places, services, jobs, housing: read for all, write for admin/moderator',
        'communityPosts: read for all, write for authenticated users',
        'userProfiles: read/write only for own profile',
        'adminLogs: write only for admin functions',
      ],
    },
    auth: {
      providers: ['email', 'google', 'apple', 'anonymous'],
      requiredFor: ['communityPosts', 'userProfiles', 'savedItems'],
    },
    storage: {
      buckets: ['placeImages', 'avatarImages', 'postImages'],
      maxFileSize: '5MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  },
};

export const PRIORITY_CITIES = [
  { city: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402, priority: 1 },
  { city: 'Győr', country: 'Hungary', lat: 47.6875, lng: 17.6504, priority: 2 },
  { city: 'Debrecen', country: 'Hungary', lat: 47.5316, lng: 21.6273, priority: 3 },
  { city: 'Szeged', country: 'Hungary', lat: 46.2530, lng: 20.1483, priority: 4 },
  { city: 'Sopron', country: 'Hungary', lat: 47.6851, lng: 16.5905, priority: 5 },
  { city: 'Pécs', country: 'Hungary', lat: 46.0727, lng: 18.2322, priority: 6 },
  { city: 'Miskolc', country: 'Hungary', lat: 48.1035, lng: 20.7784, priority: 7 },
  { city: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738, priority: 8 },
];
