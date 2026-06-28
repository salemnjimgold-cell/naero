import { initGemini, isGeminiAvailable, generateResponse } from './geminiClient';
import { getGeminiApiKey, hasGeminiApiKey } from './config';
import { detectIntent } from './router';
import { ConversationContext } from './context';
import { loadProfile, updateProfile, profileCompletion, getNextMissingField, getProfileSummary } from './profile';
import { getImmigrationGuide, getCostOfLiving, getHousingGuide, getJobGuide, getChecklist, getCityGuide, KNOWLEDGE } from './knowledge';
import { placeService, serviceService, jobService, communityService, isRealtimeEnabled, searchNearbyPlaces } from '../services';

const DELAY_MIN = 500;
const DELAY_RANGE = 800;

export class AIEngine {
  constructor() {
    this.context = new ConversationContext();
    this.profile = null;
    this._ready = false;
    this._geminiReady = false;
    this._welcomed = false;
    this._location = null;
    this._city = null;
  }

  setLocation(location, city) {
    this._location = location;
    this._city = city;
  }

  async init() {
    this.profile = await loadProfile();
    if (hasGeminiApiKey()) {
      this._geminiReady = initGemini(getGeminiApiKey());
    }
    this._ready = true;
  }

  isReady() { return this._ready; }
  isGeminiActive() { return this._geminiReady && isGeminiAvailable(); }
  getProfile() { return this.profile; }

  getProfileStatus() {
    return profileCompletion(this.profile);
  }

  async updateProfile(updates) {
    this.profile = await updateProfile(updates);
    return this.profile;
  }

  async processMessage(text, language) {
    const geminiResult = await this._tryGemini(text, language);
    if (geminiResult) {
      this.context.addEntry('user', text, { id: 'gemini_user' });
      this.context.addEntry('assistant', geminiResult, { id: 'gemini', confidence: 1 });
      return { response: geminiResult, delay: this._randomDelay(300, 600), source: 'gemini' };
    }

    return this._localProcess(text);
  }

  async _tryGemini(text, language) {
    if (!this._geminiReady || !isGeminiAvailable()) {
      return null;
    }
    try {
      const history = this.context.history;
      const result = await generateResponse({
        message: text,
        history,
        profile: this.profile,
        language: language || 'en',
        location: this._location,
        city: this._city,
      });
      return result;
    } catch {
      return null;
    }
  }

  async _localProcess(text) {
    const intent = detectIntent(text, this.profile);

    this.context.addEntry('user', text, intent);
    this._welcomed = true;

    if (intent.id === 'profile_help') {
      return this._handleProfileExtraction(text);
    }

    if (intent.id === 'unknown') {
      const response = await this._knowledgeFallback(text);
      this.context.addEntry('assistant', response, intent);
      return { response, delay: this._randomDelay(), source: 'local_knowledge' };
    }

    const userLabel = this.profile?.name || '';
    const response = this._buildResponse(intent, text, userLabel);
    this.context.addEntry('assistant', response, intent);
    return { response, delay: this._randomDelay(), source: 'local_knowledge' };
  }

  async _buildDataContext(city) {
    try {
      const [placesRes, servicesRes, jobsRes, alertsRes] = await Promise.all([
        placeService.getByCity(city || 'Budapest'),
        serviceService.getByCity(city || 'Budapest'),
        jobService.getByCity(city || 'Budapest'),
        communityService.getAlerts(city || 'Budapest'),
      ]);
      const parts = [];

      if (isRealtimeEnabled() && this._location) {
        try {
          const livePlaces = await searchNearbyPlaces(this._location.latitude, this._location.longitude, 5);
          if (livePlaces.length) {
            const liveNames = livePlaces.slice(0, 10).map(p => `${p.name} (${p.category})`).join(', ');
            parts.push(`Live places near you: ${liveNames}`);
          }
        } catch {}
      }

      if (placesRes?.data?.length) {
        parts.push(`Places in ${city || 'Budapest'}: ${placesRes.data.slice(0, 8).map(p => `${p.name} (${p.category})`).join(', ')}`);
      }
      if (servicesRes?.data?.length) {
        parts.push(`Services in ${city || 'Budapest'}: ${servicesRes.data.slice(0, 6).map(s => `${s.name} - ${s.provider} (${s.category})`).join(', ')}`);
      }
      if (jobsRes?.data?.length) {
        parts.push(`Jobs in ${city || 'Budapest'}: ${jobsRes.data.slice(0, 5).map(j => `${j.title} at ${j.company} - ${j.salary}`).join(', ')}`);
      }
      if (alertsRes?.data?.length) {
        parts.push(`Community alerts: ${alertsRes.data.slice(0, 3).map(a => a.content.substring(0, 100)).join(' | ')}`);
      }
      return parts.length ? parts.join('\n') : null;
    } catch {
      return null;
    }
  }

  async _knowledgeFallback(text) {
    const lower = text.toLowerCase();
    const userCity = this._city || 'Budapest';

    const nearbyKeywords = ['near me', 'nearby', 'close to me', 'around me', 'next to', 'near', 'قريب', 'بجانب', 'بالقرب'];
    const hasNearbyQuery = nearbyKeywords.some(k => lower.includes(k));

    if (hasNearbyQuery) {
      const dataContext = await this._buildDataContext(userCity);
      if (dataContext) {
        return (
          `Here are places and services near you in ${userCity}:\n\n` +
          dataContext.replace(/[A-Z].*?: /g, '• ') +
          '\n\nWould you like more specific information about any of these?'
        );
      }
      return (
        `Here are some services near you in ${userCity}:\n\n` +
        '- **Hospitals & Pharmacies:** International Medical Clinic (Medicover), open daily 8AM-8PM\n' +
        '- **Transport:** BKK Public Transport Info - monthly passes at 50% discount for students/refugees\n' +
        '- **Legal Help:** Free legal aid at Hungarian Helsinki Committee\n' +
        `- **Language Courses:** Balassi Institute in ${userCity}\n` +
        '- **Community:** Check the Community tab for local events and groups\n\n' +
        'Would you like more specific information about any of these services?'
      );
    }

    const pharmacyKeywords = ['pharmacy', 'pharmacie', 'صيدلية', 'drugstore', 'chemist', 'medicine', 'medication', '药房'];
    if (pharmacyKeywords.some(k => lower.includes(k))) {
      const dataContext = await this._buildDataContext(userCity);
      const pharmacyData = dataContext?.includes('pharmac') ? dataContext : null;
      if (pharmacyData) {
        return `In ${userCity}, here is what I found:\n\n${pharmacyData}\n\nPharmacies in Hungary display a green cross. Look for "GYÓGYSZERTÁR" sign. Most pharmacists speak English.`;
      }
      return (
        `In ${userCity}, you can find pharmacies at:\n\n` +
        '- **International Medical Clinic** - 1062 Budapest, Váci út 1-3 (Mon-Sun: 8AM-8PM)\n' +
        '- Most corner pharmacies (gyógyszertár) are open Mon-Fri 8AM-8PM\n' +
        '- 24-hour pharmacies are available in central areas\n' +
        '- Emergency: Dial 112 for medical help\n\n' +
        'Pharmacies in Hungary display a green cross. Look for "GYÓGYSZERTÁR" sign. Most pharmacists speak English.'
      );
    }

    const countryMap = {
      tunisia: { country: 'Tunisian', people: 'Tunisians' },
      morocco: { country: 'Moroccan', people: 'Moroccans' },
      algeria: { country: 'Algerian', people: 'Algerians' },
      egypt: { country: 'Egyptian', people: 'Egyptians' },
      syria: { country: 'Syrian', people: 'Syrians' },
      iraq: { country: 'Iraqi', people: 'Iraqis' },
      jordan: { country: 'Jordanian', people: 'Jordanians' },
      lebanon: { country: 'Lebanese', people: 'Lebanese' },
      palestine: { country: 'Palestinian', people: 'Palestinians' },
      libya: { country: 'Libyan', people: 'Libyans' },
      yemen: { country: 'Yemeni', people: 'Yemenis' },
      sudan: { country: 'Sudanese', people: 'Sudanese' },
    };

    for (const [key, info] of Object.entries(countryMap)) {
      if (lower.includes(key) || lower.includes(info.people.toLowerCase())) {
        return (
          `${info.people} are welcome in Hungary! Here is what you need to know:\n\n` +
          `**Visa & Residency:**\n` +
          `- ${info.country} citizens need a visa for stays over 90 days\n` +
          `- Apply for a D-type visa at the Hungarian embassy in your home country\n` +
          `- Common reasons: work, study, family reunification\n\n` +
          `**Work:**\n` +
          `- Your employer must obtain a work permit\n` +
          `- Process takes 4-8 weeks\n` +
          `- IT, engineering, and healthcare sectors are hiring\n\n` +
          `**Community:**\n` +
          `- There are expat communities from all over the world in Budapest\n` +
          `- Check Facebook groups for your country's community in Hungary\n` +
          `- International churches and cultural centers host regular events\n\n` +
          `Would you like specific information about work permits, study options, or housing?`
        );
      }
    }

    if (lower.includes('arabic') || lower === 'arab' || lower.includes('arab') || lower.includes('عربي') || lower.includes('العربية')) {
      return (
        'Yes, I can communicate in Arabic! بالطبع، أنا أتحدث العربية!\n\n' +
        'كيف يمكنني مساعدتك اليوم؟ سواء كانت بخصوص التأشيرات، السكن، العمل، أو الحياة في المجر، أنا هنا للمساعدة.\n\n' +
        'I can help you with:\n' +
        '- Immigration and residency (الهجرة والإقامة)\n' +
        '- Housing (السكن)\n' +
        '- Jobs and work permits (الوظائف وتصاريح العمل)\n' +
        '- Cost of living (تكاليف المعيشة)\n' +
        '- Daily life tips (نصائح الحياة اليومية)\n\n' +
        'فضلاً، أخبرني بما تحتاجه!'
      );
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('مرحبا')) {
      return (
        'Hello! Welcome to Naero AI. I am here to help you settle into your new home in Hungary.\n\n' +
        'You can ask me about:\n' +
        '• Immigration and residency procedures\n' +
        '• Finding housing and understanding costs\n' +
        '• Job search and work permits\n' +
        '• Healthcare, transport, food, and safety\n' +
        '• City guides and daily life tips\n\n' +
        'What would you like to know?'
      );
    }

    if (lower.includes('hungary') || lower.includes('hungarian') || lower.includes('magyar') || lower.includes('about') || lower.includes('what is')) {
      return (
        'Hungary is a beautiful country in Central Europe, known for:\n\n' +
        '**Capital:** Budapest - one of Europes most beautiful cities with the Danube River, thermal baths, and stunning architecture.\n\n' +
        '**Language:** Hungarian (Magyar) - a unique Uralic language, quite different from other European languages.\n\n' +
        '**Currency:** Hungarian Forint (HUF)\n\n' +
        '**Population:** ~9.6 million\n\n' +
        '**EU Member:** Yes, since 2004. Schengen Area member.\n\n' +
        '**Key facts for newcomers:**\n' +
        '- Cost of living is lower than Western Europe\n' +
        '- English is widely spoken in Budapest\n' +
        '- Public transport is excellent and affordable\n' +
        '- Healthcare system available with TAJ number\n' +
        '- Rich culture with thermal baths, festivals, and cuisine\n\n' +
        'What specific aspect of Hungary would you like to know more about?'
      );
    }

    if (lower.includes('thank') || lower.includes('thanks') || lower.includes('شكر')) {
      return 'You are welcome! If you have any more questions about settling in Hungary, feel free to ask. I am here to help!';
    }

    if (lower.includes('how are you') || lower.includes('how do you')) {
      return "I'm doing great, thank you for asking! I am here and ready to help you with anything related to your life in Hungary. What can I assist you with?";
    }

    return (
      "I am here to help with information about settling in Hungary. Here are some things I can help you with:\n\n" +
      '• Immigration & Residency (visas, permits, paperwork)\n' +
      '• Housing (districts, renting, costs)\n' +
      '• Jobs & Work Permits\n' +
      '• Cost of Living (budget, expenses)\n' +
      '• Newcomer Checklist (first steps)\n' +
      '• City Guide (Budapest & other cities)\n' +
      '• Healthcare, Transport, Food, Safety\n' +
      '• Language & Translation\n\n' +
      'Just ask me anything!'
    );
  }

  async _handleProfileExtraction(text) {
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

    return this._fallbackResponse();
  }

  _onboardingPrompt() {
    const status = profileCompletion(this.profile);
    if (status.isComplete) {
      const summary = getProfileSummary(this.profile);
      return 'Welcome back' + (summary ? ', ' + summary : '') + '! How can I help you today?';
    }
    const nextField = getNextMissingField(this.profile);
    if (nextField) {
      return (
        "Hi! I'm Naero AI, your personal integration assistant. To give you the best help,\n" +
        'let me get to know you a bit.\n\n' +
        nextField.prompt
      );
    }
    return 'Hi! I\'m Naero AI. How can I help you settle in?';
  }

  _onboardingProgress() {
    const status = profileCompletion(this.profile);
    if (status.isComplete) {
      const summary = getProfileSummary(this.profile);
      return (
        'Thanks, ' + (this.profile?.name || 'there') + '! I now have your profile set up.\n\n' +
        'Here is what I know:\n' +
        (summary || 'Your preferences') + '\n\n' +
        'I can help you with:\n' +
        '- Immigration and residency guidance\n' +
        '- Housing and cost of living\n' +
        '- Jobs and work permits\n' +
        '- Daily newcomer checklist\n' +
        '- City-specific tips\n\n' +
        'What would you like help with first?'
      );
    }
    const pct = status.pct;
    const nextField = getNextMissingField(this.profile);
    let msg = 'Thanks! I have ' + pct + '% of your profile.';
    if (nextField) {
      msg += '\n\n' + nextField.prompt;
    }
    return msg;
  }

  _buildResponse(intent, text, userName) {
    const greeting = userName ? 'Hey ' + userName + '! ' : '';
    const data = this._getIntentData(intent);

    if (data) {
      return greeting + data;
    }

    if (intent.parent === 'immigration') {
      const reason = intent.subIntent ? intent.subIntent.replace('immigration_', '') : 'general';
      return greeting + getImmigrationGuide(reason);
    }

    return greeting + this._fallbackResponse();
  }

  _getIntentData(intent) {
    switch (intent.id) {
      case 'immigration':
        return getImmigrationGuide('general');
      case 'immigration_work':
        return getImmigrationGuide('work');
      case 'immigration_study':
        return getImmigrationGuide('study');
      case 'immigration_family':
        return getImmigrationGuide('family');
      case 'immigration_asylum':
        return getImmigrationGuide('refugee');
      case 'housing':
        return getHousingGuide(null);
      case 'cost_of_living':
        return getCostOfLiving(userCity(this.profile));
      case 'jobs':
        return getJobGuide();
      case 'checklist':
        return getChecklist();
      case 'city_guide':
        return getCityGuide();
      case 'translate':
        return 'I can help with translation! Just tell me what you would like translated and to which language (Arabic, French, Hungarian, or English).\n\nExample: Translate "How much does this cost?" to Hungarian';
      case 'healthcare':
        return KNOWLEDGE.city.budapest.hospitals;
      case 'transport':
        return KNOWLEDGE.city.budapest.transport;
      case 'food':
        return (
          'Hungarian food you must try:\n\n' +
          '- Gulyas - hearty soup\n' +
          '- Langos - fried dough\n' +
          '- Kurtoskalacs - chimney cake\n' +
          '- Paprikas csirke - chicken in paprika'
        );
      case 'safety':
        return (
          'Safety tips:\n\n' +
          '- Emergency: 112\n' +
          '- Police: 107\n' +
          '- Ambulance: 104\n' +
          '- Fire: 105\n\n' +
          'Budapest is generally safe. Watch for pickpockets on trams and metro.'
        );
      default:
        return null;
    }
  }

  _fallbackResponse() {
    return (
      "I'm here to help you settle into your new home! Try asking me about:\n\n" +
      '- Immigration & Residency\n' +
      '- Housing (districts, prices, tips)\n' +
      '- Jobs & Work Permits\n' +
      '- Cost of Living\n' +
      '- Newcomer Checklist\n' +
      '- City Guide (Budapest)\n' +
      '- Healthcare, Transport, Food\n' +
      '- Community & Events\n\n' +
      'What would you like to know?'
    );
  }

  _randomDelay(min, max) {
    const lo = min || DELAY_MIN;
    const hi = max || DELAY_RANGE;
    return lo + Math.random() * (hi - lo);
  }

  async reset() {
    this.context.reset();
    this._welcomed = false;
    this.profile = await loadProfile();
  }
}

function userCity(profile) {
  if (!profile?.toCity) return 'budapest';
  const city = profile.toCity.toLowerCase();
  const known = ['budapest', 'debrecen', 'szeged', 'pecs', 'gyor', 'miskolc'];
  return known.includes(city) ? city : 'budapest';
}
