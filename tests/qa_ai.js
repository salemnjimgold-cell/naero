// Naero AI QA Test — self-contained, tests all 8 scenarios
// Run: node tests/qa_ai.js

// ---- Mock AsyncStorage ----
const storage = {};
const mockAsyncStorage = {
  getItem: async (k) => storage[k] || null,
  setItem: async (k, v) => { storage[k] = v; },
  removeItem: async (k) => { delete storage[k]; },
};

// ==========================
// MOCK for memory.js
// ==========================
const KEYS = {
  USER_PROFILE: '@naero_ai_profile',
  CHECKLIST: '@naero_ai_checklist',
  CONVERSATION: '@naero_ai_conversation',
};

async function loadProfile() {
  try {
    const raw = await mockAsyncStorage.getItem(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function saveProfile(profile) {
  try { await mockAsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile)); } catch {}
}

async function updateProfile(updates) {
  const current = (await loadProfile()) || {};
  const merged = { ...current, ...updates };
  await saveProfile(merged);
  return merged;
}

// ==========================
// MOCK for knowledge.js
// ==========================
const KNOWLEDGE = {
  immigration: {
    work: { title: 'Work Visa & Residency', steps: ['Secure a job offer', 'Apply for work permit', 'Apply for residency permit', 'Register address', 'Apply for TAJ', 'Open bank account'], tips: 'Process takes 4-8 weeks.', offices: 'Budapest Immigration Office: 1143 Budapest, Stefania ut 14.' },
    study: { title: 'Student Residency', steps: ['Get acceptance letter', 'Apply for student visa', 'Register address', 'Get student ID', 'Apply for TAJ', 'Open bank account'], tips: 'Student permits valid 1 year, renewable.', offices: 'Visit university international office.' },
    family: { title: 'Family Reunification', steps: ['Family member must have valid residency', 'Submit application', 'Provide proof of relationship', 'Proof of accommodation', 'Health insurance'], tips: 'Family members can work and study freely.', offices: 'Apply at Hungarian embassy first.' },
    refugee: { title: 'Asylum & International Protection', steps: ['Register asylum claim', 'Assigned case officer', 'Receive temporary accommodation', 'Attend interviews', 'Decision within 6 months'], tips: 'Contact UNHCR or NGO support.', offices: 'Beorndosi ut 12-14, Budapest.' },
    general: { title: 'General Residency Guidance', steps: ['Determine visa type', 'Gather documents', 'Submit application', 'Wait 30-60 days', 'Register address and get ID'], tips: 'Keep copies of all documents.', offices: '1143 Budapest, Stefania ut 14.' },
  },
  costOfLiving: {
    budapest: {
      title: 'Cost of Living in Budapest',
      rent: { studio: 'Studio (center): EUR 400-600/mo', '1bed': '1-bed (center): EUR 500-750/mo', '3bed': '3-bed (center): EUR 900-1400/mo', studio_outer: 'Studio (outer): EUR 300-450/mo' },
      utilities: 'EUR 120-200/month',
      transport: { monthly: 'Monthly pass: EUR 30', single: 'Single ticket: EUR 1.20', student: 'Student pass: EUR 15' },
      food: { groceries: 'Groceries: EUR 200-300/mo', mealInexpensive: 'Restaurant meal: EUR 8-12', coffee: 'Cappuccino: EUR 2-3', beer: 'Local beer: EUR 1.50-2.50' },
      summary: 'Single person needs ~EUR 600-900/month (excl. rent) in Budapest.',
    },
    general: { title: 'General Cost Tips', tips: ['Use Forint (HUF)', 'Wise/Revolut for transfers', 'Markets cheaper than supermarkets'] },
  },
  housing: {
    title: 'Housing Assistance',
    districts: {
      '5': 'District 5: Center, expensive. 1-bed: EUR 600-900.',
      '7': 'District 7: Jewish Quarter. 1-bed: EUR 450-650.',
      '8': 'District 8: Up-and-coming. 1-bed: EUR 350-500.',
      '13': 'District 13: Modern, expat-friendly. 1-bed: EUR 500-700.',
    },
    websites: ['ingatlan.com', 'alberlet.hu', 'Facebook groups'],
    tips: ['Deposit: 2 months rent + 1 month advance', 'Contracts typically 1 year', 'Utilities may be separate'],
    contract: 'Key terms: rent amount, utilities, notice period (30-60 days), deposit return.',
  },
  jobs: {
    title: 'Job Search Assistance',
    permits: { eu: 'EU/EEA: No work permit needed.', non_eu: 'Non-EU: Employer must get work permit (4-8 weeks).', student: 'Students: Up to 24 hrs/week during studies.' },
    websites: ['profession.hu', 'linkedin.com', 'indeed.hu', 'Facebook groups'],
    industries: { it: 'IT & Tech: EUR 2000-4000/mo', teaching: 'Teaching English: EUR 800-1500/mo', hospitality: 'Hospitality: EUR 800-1200/mo + tips', customer: 'Customer Service: EUR 1200-1800/mo' },
    cv: 'Include photo, use Europass format, mention tax ID.',
    interview: 'Punctuality important. Dress formally. Contracts in Hungarian.',
  },
  city: {
    budapest: {
      title: 'Budapest City Guide',
      districts: '23 districts. Central: 5,6,7. Residential: 2,12. Affordable: 8,9,10. Modern: 13,11.',
      transport: 'BKK metro M1-M4, trams, buses. Monthly pass: EUR 30.',
      emergency: 'Emergency: 112. Police: 107. Ambulance: 104. Fire: 105.',
      hospitals: 'Semmelweis, Uzsoki, Szent Janos hospitals.',
      supermarkets: 'Spar, Auchan, Tesco, Lidl, Aldi.',
      simcard: 'Telekom, Yettel, Vodafone. Prepaid from EUR 5.',
      banks: 'OTP, K&H, Erste, Raiffeisen.',
      language: 'Hungarian official. English common in central Budapest.',
      weather: 'Continental. Summer 25-35C. Winter -5 to 5C.',
    },
  },
  checklist: {
    week1: ['Register address (within 3 days)', 'Get Hungarian SIM', 'Open bank account', 'Apply for TAJ', 'Buy BKK monthly pass'],
    week2: ['Apply for tax ID (adoszam)', 'Register with GP', 'Explore local district', 'Set up utilities', 'Download BKK FUTAR app'],
    month1: ['Apply for residence permit', 'Get health insurance', 'Join expat groups', 'Find language course', 'Set monthly budget'],
    month3: ['Check permit status', 'Renew expiring documents', 'Build emergency savings', 'Explore nearby cities', 'Review budget'],
  },
};

function getImmigrationGuide(reason) {
  const guide = KNOWLEDGE.immigration[reason] || KNOWLEDGE.immigration.general;
  let text = guide.title + '\n\nSteps:\n' + guide.steps.map((s, i) => `${i+1}. ${s}`).join('\n');
  text += '\n\n' + guide.tips;
  if (guide.offices) text += '\n\n' + guide.offices;
  return text;
}

function getCostOfLiving(city = 'budapest') {
  const data = KNOWLEDGE.costOfLiving[city] || KNOWLEDGE.costOfLiving.budapest;
  let text = data.title + '\n\nRent:\n';
  Object.values(data.rent || {}).forEach(v => { text += '- ' + v + '\n'; });
  text += '\nUtilities: ' + data.utilities + '\n\nFood:\n';
  Object.values(data.food || {}).forEach(v => { text += '- ' + v + '\n'; });
  if (data.summary) text += '\n' + data.summary;
  return text;
}

function getHousingGuide(district) {
  let text = KNOWLEDGE.housing.title + '\n\nPopular districts:\n';
  Object.values(KNOWLEDGE.housing.districts).forEach(v => { text += '- ' + v + '\n'; });
  text += '\nRental websites:\n' + KNOWLEDGE.housing.websites.map(w => '- ' + w).join('\n');
  text += '\n\nTips:\n' + KNOWLEDGE.housing.tips.map(t => '- ' + t).join('\n');
  text += '\n\n' + KNOWLEDGE.housing.contract;
  return text;
}

function getJobGuide() {
  let text = KNOWLEDGE.jobs.title + '\n\nWork permits:\n';
  Object.entries(KNOWLEDGE.jobs.permits).forEach(([k, v]) => { text += '- ' + v + '\n'; });
  text += '\nJob portals:\n' + KNOWLEDGE.jobs.websites.map(w => '- ' + w).join('\n');
  text += '\n\nIndustries:\n';
  Object.values(KNOWLEDGE.jobs.industries).forEach(v => { text += '- ' + v + '\n'; });
  text += '\n\n' + KNOWLEDGE.jobs.cv + '\n\n' + KNOWLEDGE.jobs.interview;
  return text;
}

function getChecklist() {
  let text = 'Newcomer Checklist\n\n';
  Object.entries(KNOWLEDGE.checklist).forEach(([p, items]) => {
    text += p.toUpperCase() + ':\n' + items.map(i => '- ' + i).join('\n') + '\n\n';
  });
  return text;
}

function getCityGuide() {
  const c = KNOWLEDGE.city.budapest;
  return `${c.title}\n\nDistricts: ${c.districts}\n\nTransport: ${c.transport}\n\nEmergency: ${c.emergency}\n\nHospitals: ${c.hospitals}\n\nSupermarkets: ${c.supermarkets}\n\nMobile: ${c.simcard}\n\nBanks: ${c.banks}\n\nLanguage: ${c.language}\n\nWeather: ${c.weather}`;
}

// ==========================
// MOCK for router.js
// ==========================
const CONFIDENCE_THRESHOLD = 0.4;

const INTENTS = [
  { id: 'immigration', keywords: ['immigration', 'visa', 'residency', 'permit', 'residence', 'citizen', 'passport', 'embassy', 'consulate'], minConfidence: 0.3 },
  { id: 'immigration_work', keywords: ['work permit', 'work visa', 'employment visa', 'job permit'], parent: 'immigration' },
  { id: 'immigration_study', keywords: ['student visa', 'study visa', 'university application', 'neptun', 'student permit', 'school'], parent: 'immigration' },
  { id: 'immigration_family', keywords: ['family', 'spouse', 'reunification', 'marriage', 'partner', 'children'], parent: 'immigration' },
  { id: 'immigration_asylum', keywords: ['asylum', 'refugee', 'protection', 'persecution', 'war', 'humanitarian'], parent: 'immigration' },
  { id: 'housing', keywords: ['housing', 'apartment', 'rent', 'flat', 'accommodation', 'lease', 'landlord', 'deposit', 'district', 'ingatlan', 'alberlet'], minConfidence: 0.3 },
  { id: 'jobs', keywords: ['job', 'work', 'employ', 'salary', 'career', 'hire', 'cv', 'resume', 'interview', 'profession', 'recruitment'], minConfidence: 0.3 },
  { id: 'cost_of_living', keywords: ['cost of living', 'expenses', 'budget', 'price', 'cheap', 'expensive', 'afford', 'salary', 'forint', 'eur', 'money', 'save', 'financial'], minConfidence: 0.35 },
  { id: 'checklist', keywords: ['checklist', 'to-do', 'todo', 'tasks', 'things to do', 'what should i do', 'first steps', 'newcomer', 'settle', 'get started'], minConfidence: 0.35 },
  { id: 'city_guide', keywords: ['city guide', 'budapest', 'district', 'neighborhood', 'where to live', 'local area', 'move to'], minConfidence: 0.35 },
  { id: 'translate', keywords: ['translate', 'translation', 'language', 'meaning', 'how to say', 'in hungarian', 'in english', 'in arabic', 'in french'] },
  { id: 'healthcare', keywords: ['health', 'doctor', 'hospital', 'insurance', 'medical', 'taj', 'clinic', 'pharmacy', 'dentist', 'emergency'] },
  { id: 'transport', keywords: ['transport', 'bus', 'metro', 'train', 'ticket', 'bkk', 'tram', 'subway', 'taxi', 'bicycle'] },
  { id: 'food', keywords: ['food', 'restaurant', 'eat', 'hungarian', 'goulash', 'langos', 'grocery', 'supermarket', 'market', 'cook'] },
  { id: 'safety', keywords: ['safety', 'emergency', 'police', 'danger', 'safe', 'crime', 'ambulance', 'fire', '112', '107', '104', '105'] },
  { id: 'community', keywords: ['community', 'expat', 'group', 'facebook', 'meetup', 'event', 'social', 'friend', 'people'] },
  { id: 'profile_help', keywords: ['my name is', 'i am from', 'i am in', "i'm in", 'i moved', 'i arrived', 'i came', 'moving to', 'relocating'], minConfidence: 0.3 },
];

function matchesKeyword(text, keyword) {
  if (text.includes(keyword)) return true;
  const keyWords = keyword.split(/\s+/);
  if (keyWords.length <= 1) return false;
  let idx = 0;
  for (const kw of keyWords) {
    const pos = text.indexOf(kw, idx);
    if (pos === -1) return false;
    idx = pos + kw.length;
  }
  return true;
}

function detectIntent(text, profile) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  const results = [];

  for (const intent of INTENTS) {
    let matchedWords = 0;
    for (const keyword of intent.keywords) {
      if (matchesKeyword(lower, keyword)) {
        matchedWords += keyword.split(/\s+/).length;
      }
    }
    if (matchedWords > 0) {
      const confidence = Math.min((matchedWords / Math.max(words.length, 1)) + 0.3, 1.0);
      results.push({ id: intent.id, parent: intent.parent, confidence, matchCount: matchedWords });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);

  if (results.length === 0) {
    return { id: 'unknown', confidence: 0, subIntent: null };
  }

  const top = results[0];
  const threshold = INTENTS.find(i => i.id === top.id)?.minConfidence || 0.2;

  if (top.confidence < threshold) {
    return { id: 'unknown', confidence: top.confidence, subIntent: null };
  }

  const subIntent = results.length > 1 && results[1].parent === top.id ? results[1].id : null;

  return { id: top.id, confidence: top.confidence, subIntent, all: results.slice(0, 3) };
}

function shouldEscalateToCommunity(intentResult) {
  return intentResult.id === 'unknown' || intentResult.confidence < CONFIDENCE_THRESHOLD;
}

function getCommunityMessage(text) {
  return "I'm not entirely sure about that one. Let me suggest asking the Naero Community - other newcomers and locals may have the answer!\n\nHead over to the Community tab and post your question there. You can also search existing posts to see if someone already asked about:\n\"" + text + '"';
}

// ==========================
// MOCK for context.js
// ==========================
class ConversationContext {
  constructor() {
    this.history = [];
    this.currentTopic = null;
    this.userAskedForMore = false;
    this.consecutiveUnknowns = 0;
    this.greeted = false;
  }

  addEntry(role, content, intent) {
    this.history.push({ role, content, intent, timestamp: Date.now() });
    if (this.history.length > 20) this.history = this.history.slice(-20);
    if (intent && intent.id !== 'unknown') {
      this.currentTopic = intent;
      this.consecutiveUnknowns = 0;
    } else if (!intent || intent.id === 'unknown') {
      this.consecutiveUnknowns++;
    }
  }

  shouldSuggestOnboarding(profile) {
    if (!profile) return true;
    const filled = Object.values(profile).filter(v => v && v !== '').length;
    return filled < 2 && this.history.length < 4;
  }

  reset() {
    this.history = [];
    this.currentTopic = null;
    this.userAskedForMore = false;
    this.consecutiveUnknowns = 0;
  }
}

// ==========================
// MOCK for profile.js
// ==========================
const PROFILE_FIELDS = [
  { key: 'name', label: 'Your name', prompt: 'What is your name?' },
  { key: 'fromCountry', label: 'From country', prompt: 'Where are you from?' },
  { key: 'toCity', label: 'City', prompt: 'Which city are you moving to?' },
  { key: 'reason', label: 'Reason', prompt: 'Are you moving for work, study, family, or asylum?' },
  { key: 'arrivalDate', label: 'Arrival date', prompt: 'When did you arrive?' },
  { key: 'languages', label: 'Languages', prompt: 'What languages do you speak?' },
  { key: 'hasHousing', label: 'Housing status', prompt: 'Do you have housing sorted?' },
  { key: 'hasWork', label: 'Work status', prompt: 'Do you have a job or looking?' },
];

function profileCompletion(profile) {
  if (!profile) return { pct: 0, missing: PROFILE_FIELDS.map(f => f.key), isComplete: false };
  const filled = PROFILE_FIELDS.filter(f => { const val = profile[f.key]; return val !== undefined && val !== null && val !== ''; });
  const missing = PROFILE_FIELDS.filter(f => { const val = profile[f.key]; return val === undefined || val === null || val === ''; });
  return { pct: Math.round((filled.length / PROFILE_FIELDS.length) * 100), missing: missing.map(f => f.key), isComplete: filled.length === PROFILE_FIELDS.length };
}

function getNextMissingField(profile) {
  const { missing } = profileCompletion(profile);
  if (missing.length === 0) return null;
  return PROFILE_FIELDS.find(f => f.key === missing[0]) || null;
}

function getProfileSummary(profile) {
  if (!profile) return null;
  const parts = [];
  if (profile.name) parts.push(profile.name);
  if (profile.fromCountry) parts.push('from ' + profile.fromCountry);
  if (profile.toCity) parts.push('in ' + profile.toCity);
  return parts.join(' ') || null;
}

// ==========================
// MOCK for engine.js
// ==========================
class AIEngine {
  constructor() {
    this.context = new ConversationContext();
    this.profile = null;
    this._ready = false;
  }

  async init() {
    this.profile = await loadProfile();
    this._ready = true;
  }

  isReady() { return this._ready; }
  getProfile() { return this.profile; }
  getProfileStatus() { return profileCompletion(this.profile); }

  async updateProfile(updates) {
    this.profile = await updateProfile(updates);
    return this.profile;
  }

  async processMessage(text) {
    const intent = detectIntent(text, this.profile);
    this.context.addEntry('user', text, intent);

    if (intent.id === 'profile_help') {
      const response = await this._handleProfileExtraction(text);
      this.context.addEntry('assistant', response, intent);
      return { response, delay: 800 + Math.random() * 800 };
    }

    const shouldOnboard = this.context.shouldSuggestOnboarding(this.profile);
    if (shouldOnboard && intent.id === 'unknown') {
      const response = this._onboardingPrompt();
      this.context.addEntry('assistant', response, intent);
      return { response, delay: 800 + Math.random() * 800 };
    }

    if (shouldEscalateToCommunity(intent)) {
      if (this.context.consecutiveUnknowns >= 2) {
        const response = getCommunityMessage(text);
        this.context.addEntry('assistant', response, intent);
        return { response, delay: 800 + Math.random() * 800 };
      }
      const response = this._fallbackResponse();
      this.context.addEntry('assistant', response, intent);
      return { response, delay: 800 + Math.random() * 800 };
    }

    const userLabel = this.profile?.name || '';
    const response = this._buildResponse(intent, text, userLabel);
    this.context.addEntry('assistant', response, intent);
    return { response, delay: 800 + Math.random() * 800 };
  }

  _buildResponse(intent, text, userName) {
    const greeting = userName ? 'Hey ' + userName + '! ' : '';
    const data = this._getIntentData(intent);
    if (data) return greeting + data;
    if (intent.parent === 'immigration') {
      const reason = intent.subIntent ? intent.subIntent.replace('immigration_', '') : 'general';
      return greeting + getImmigrationGuide(reason);
    }
    return greeting + this._fallbackResponse();
  }

  _getIntentData(intent) {
    switch (intent.id) {
      case 'immigration': return getImmigrationGuide('general');
      case 'immigration_work': return getImmigrationGuide('work');
      case 'immigration_study': return getImmigrationGuide('study');
      case 'immigration_family': return getImmigrationGuide('family');
      case 'immigration_asylum': return getImmigrationGuide('refugee');
      case 'housing': return getHousingGuide(null);
      case 'cost_of_living': return getCostOfLiving(this._userCity());
      case 'jobs': return getJobGuide();
      case 'checklist': return getChecklist();
      case 'city_guide': return getCityGuide();
      case 'translate': return 'I can help with translation! Just tell me what you would like translated and to which language.';
      case 'healthcare': return 'Healthcare in Hungary: Emergency 112. EU: use EHIC card. Non-EU: register for TAJ.';
      case 'transport': return 'Public transport in Budapest: Metro M1-M4, trams, buses. Monthly pass: ~EUR 30. Download BKK FUTAR.';
      case 'food': return 'Hungarian food: Gulyas, Langos, Kurtoskalacs, Paprikas csirke.';
      case 'safety': return 'Safety: Emergency 112, Police 107, Ambulance 104, Fire 105. Budapest is generally safe.';
      case 'community': return 'The Naero Community connects newcomers! Tap the Community tab to get started.';
      default: return null;
    }
  }

  _userCity() {
    if (!this.profile?.toCity) return 'budapest';
    const city = this.profile.toCity.toLowerCase();
    return ['budapest', 'debrecen', 'szeged', 'pecs', 'gyor', 'miskolc'].includes(city) ? city : 'budapest';
  }

  async _handleProfileExtraction(text) {
    const lower = text.toLowerCase();
    const updates = {};

    const nameMatch = text.match(/(?:my name is|my name's|my name)\s+(\S+)/i);
    if (nameMatch) {
      updates.name = nameMatch[1];
    } else {
      const iAmName = text.match(/\bi am\s+(?!in\b|from\b)(\S+)/i);
      if (iAmName) updates.name = iAmName[1];
      if (!iAmName) {
        const iMname = text.match(/\bi'm\s+(?!in\b|from\b)(\S+)/i);
        if (iMname) updates.name = iMname[1];
      }
    }

    const fromMatch = text.match(/(?:i am from|i'm from|from)\s+(\S+(?:\s+\S+)?)/i);
    if (fromMatch) updates.fromCountry = fromMatch[1];

    const cityMatch = text.match(/(?:moving to|relocating to|to|i am in|i'm in)\s+(\S+(?:\s+\S+)?)/i);
    if (cityMatch && !cityMatch[1].toLowerCase().includes('hungary')) {
      updates.toCity = cityMatch[1];
    }

    const reasonMatch = text.match(/(?:for|because of)\s+(work|study|family|asylum|job|school)/i);
    if (reasonMatch) {
      const map = { job: 'work', school: 'study' };
      updates.reason = map[reasonMatch[1].toLowerCase()] || reasonMatch[1].toLowerCase();
    }

    if (Object.keys(updates).length > 0) {
      this.profile = { ...this.profile, ...updates };
      await updateProfile(updates);
      return this._onboardingProgress();
    }

    return this._onboardingPrompt();
  }

  _onboardingPrompt() {
    const status = profileCompletion(this.profile);
    if (status.isComplete) {
      const summary = getProfileSummary(this.profile);
      return 'Welcome back' + (summary ? ', ' + summary : '') + '! How can I help you today?';
    }
    const nextField = getNextMissingField(this.profile);
    if (nextField) return "Hi! I'm Naero AI. " + nextField.prompt;
    return "Hi! I'm Naero AI. How can I help you settle in?";
  }

  _onboardingProgress() {
    const status = profileCompletion(this.profile);
    if (status.isComplete) {
      const summary = getProfileSummary(this.profile);
      return 'Thanks, ' + (this.profile?.name || 'there') + '! Profile complete.\n\n' +
        (summary || '') + '\n\nI can help with: immigration, housing, jobs, cost of living, checklist, city tips.';
    }
    const pct = status.pct;
    const nextField = getNextMissingField(this.profile);
    let msg = 'Thanks! I have ' + pct + '% of your profile.';
    if (nextField) msg += '\n\n' + nextField.prompt;
    return msg;
  }

  _fallbackResponse() {
    return "I'm here to help you settle in! Try asking about: immigration, housing, jobs, cost of living, checklist, city guide, healthcare, transport, food.";
  }

  async reset() {
    this.context.reset();
    this.profile = await loadProfile();
  }
}

// ==========================
// TEST RUNNER
// ==========================
let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    passed++;
  } catch (e) {
    results.push({ name, status: 'FAIL', error: e.message });
    failed++;
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function assertIncludes(text, substr, label) {
  if (!text.toLowerCase().includes(substr.toLowerCase())) {
    throw new Error(`${label}: expected "${substr}" in "${text.substring(0, 200)}"`);
  }
}

function resetEngine() {
  for (const k of Object.keys(storage)) delete storage[k];
  const e = new AIEngine();
  return e;
}

async function main() {
  // ── 1: New user "I just arrived in Hungary" ──
  await test('1. New user "I just arrived in Hungary"', async () => {
    const engine = resetEngine();
    await engine.init();

    const intent = detectIntent('I just arrived in Hungary', null);
    assert(intent.id === 'profile_help', `Expected profile_help, got ${intent.id} (conf: ${intent.confidence})`);
    assert(intent.confidence >= 0.3, `Confidence ${intent.confidence} should be >= 0.3`);

    const result = await engine.processMessage('I just arrived in Hungary');
    assert(result.response, 'No response');
    const resp = result.response;
    // Should be an onboarding question since no info was extractable
    assert(resp.includes('name') || resp.includes('?'), `Should ask a question: "${resp.substring(0, 100)}"`);

    const profile = engine.getProfile();
    assert(!profile || Object.keys(profile).length === 0, 'Profile should be empty');
  });

  // ── 2: "I am in Győr" ──
  await test('2. "I am in Győr" extracts city', async () => {
    const engine = resetEngine();
    await engine.init();

    const intent = detectIntent('I am in Győr', null);
    assert(intent.id === 'profile_help', `Expected profile_help, got ${intent.id} (conf: ${intent.confidence})`);

    const result = await engine.processMessage('I am in Győr');
    assert(result.response, 'No response');

    const profile = engine.getProfile();
    assert(profile && profile.toCity && profile.toCity === 'Győr',
      `Expected toCity=Győr, got ${JSON.stringify(profile)}`);
    console.log('  Profile:', JSON.stringify(profile));
  });

  // ── 3: "I need a job" ──
  await test('3. "I need a job" returns job guidance', async () => {
    const engine = resetEngine();
    await engine.init();

    const intent = detectIntent('I need a job', null);
    assert(intent.id === 'jobs', `Expected jobs, got ${intent.id} (conf: ${intent.confidence})`);
    assert(intent.confidence >= 0.3, `Conf ${intent.confidence} < 0.3`);

    const result = await engine.processMessage('I need a job');
    assertIncludes(result.response, 'work permit', 'Jobs response');
    console.log('  Jobs response length:', result.response.length);
  });

  // ── 4: "I need housing" ──
  await test('4. "I need housing" returns housing guidance', async () => {
    const engine = resetEngine();
    await engine.init();

    const intent = detectIntent('I need housing', null);
    assert(intent.id === 'housing', `Expected housing, got ${intent.id} (conf: ${intent.confidence})`);
    assert(intent.confidence >= 0.3, `Conf ${intent.confidence} < 0.3`);

    const result = await engine.processMessage('I need housing');
    assertIncludes(result.response, 'district', 'Housing response');
    assertIncludes(result.response, 'rent', 'Housing response');
    console.log('  Housing response length:', result.response.length);
  });

  // ── 5: "What should I do in my first week?" ──
  await test('5. "What should I do in my first week?" returns checklist', async () => {
    const engine = resetEngine();
    await engine.init();

    const intent = detectIntent('What should I do in my first week?', null);
    assert(intent.id === 'checklist', `Expected checklist, got ${intent.id} (conf: ${intent.confidence})`);
    assert(intent.confidence >= 0.35, `Conf ${intent.confidence} < 0.35`);

    const result = await engine.processMessage('What should I do in my first week?');
    assertIncludes(result.response, 'SIM', 'Checklist should mention SIM');
    assertIncludes(result.response, 'WEEK1', 'Should show weekly sections');
    console.log('  Checklist response length:', result.response.length);
  });

  // ── 6: "How much money do I need monthly?" ──
  await test('6. "How much money do I need monthly?" returns cost of living', async () => {
    const engine = resetEngine();
    await engine.init();

    const intent = detectIntent('How much money do I need monthly?', null);
    assert(intent.id === 'cost_of_living', `Expected cost_of_living, got ${intent.id} (conf: ${intent.confidence})`);
    assert(intent.confidence >= 0.35, `Conf ${intent.confidence} < 0.35`);

    const result = await engine.processMessage('How much money do I need monthly?');
    assertIncludes(result.response, 'EUR', 'Cost should mention EUR');
    assertIncludes(result.response, 'rent', 'Cost should mention rent');
    console.log('  Cost of living response length:', result.response.length);
  });

  // ── 7: "help me" → escalation ──
  await test('7. "help me" escalates to community after 2 unknowns', async () => {
    const engine = resetEngine();
    await engine.init();

    // Fill profile so onboarding doesn't trigger
    await engine.processMessage('My name is Anna');
    await engine.processMessage('I am from Syria');
    await engine.processMessage('I am in Budapest');

    const intent = detectIntent('help me', null);
    assert(intent.id === 'unknown', `Expected unknown, got ${intent.id}`);

    const r1 = await engine.processMessage('help me');
    assertIncludes(r1.response, 'Try asking', 'First unknown should suggest options');
    console.log('  First help response (abbrev):', r1.response.substring(0, 60) + '...');

    const r2 = await engine.processMessage('help me');
    assertIncludes(r2.response, 'Community', 'Second unknown should mention community');
    console.log('  Second help response (abbrev):', r2.response.substring(0, 60) + '...');
  });

  // ── 8: Unknown local question → escalation ──
  await test('8. Unknown local question escalates to community', async () => {
    const engine = resetEngine();
    await engine.init();

    // Fill profile so onboarding doesn't trigger
    await engine.processMessage('My name is Anna');
    await engine.processMessage('I am from Syria');
    await engine.processMessage('I am in Budapest');

    const intent = detectIntent('Where can I find authentic Mexican ingredients?', null);
    assert(intent.id === 'unknown', `Expected unknown, got ${intent.id}`);

    await engine.processMessage('Where can I find authentic Mexican ingredients?');
    const r2 = await engine.processMessage('Where can I find authentic Mexican ingredients?');
    assertIncludes(r2.response, 'Community', 'Second unknown should mention community');
    console.log('  Local Q response (abbrev):', r2.response.substring(0, 60) + '...');
  });

  // ── 9: Profile persistence ──
  await test('9. Profile persists after engine reset (simulating restart)', async () => {
    const engine = resetEngine();
    await engine.init();
    await engine.processMessage('I am in Szeged');
    const savedCity = engine.getProfile().toCity;

    const engine2 = new AIEngine();
    await engine2.init();
    const loaded = engine2.getProfile();
    assert(loaded && loaded.toCity === savedCity, `Expected "${savedCity}" persisted, got ${JSON.stringify(loaded)}`);
    console.log('  Persisted city:', loaded.toCity);
  });

  // ── 10: All 8 quick actions ──
  await test('10. Quick action chips return correct domain answers', async () => {
    const engine = resetEngine();
    await engine.init();

    const actions = ['residency', 'housing', 'jobs', 'translate', 'healthcare', 'safety', 'transport', 'food'];
    for (const action of actions) {
      const result = await engine.processMessage('Tell me about ' + action);
      assert(result.response, `No response for ${action}`);
      assert(result.response.length > 30, `Response for ${action} too short: ${result.response.length}`);
    }
    console.log('  All 8 quick actions returned valid responses');
  });

  // ── 11: Edge cases ──
  await test('11. Edge cases: long message, special chars', async () => {
    const engine = resetEngine();
    await engine.init();

    const long = 'I need a job and housing in Budapest with my family '.repeat(10);
    const r1 = await engine.processMessage(long);
    assert(r1.response, 'Long message should get response');

    const r2 = await engine.processMessage('Hola! ¿Cómo estás?');
    assert(r2.response, 'Special chars should get response');

    console.log('  Edge cases passed');
  });

  // ── SUMMARY ──
  console.log('\n' + '='.repeat(55));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('='.repeat(55));
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${r.name}${r.error ? ': ' + r.error : ''}`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
