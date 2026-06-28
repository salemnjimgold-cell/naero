const CONFIDENCE_THRESHOLD = 0.4;

const INTENTS = [
  {
    id: 'immigration',
    keywords: ['immigration', 'visa', 'residency', 'permit', 'residence', 'citizen', 'passport', 'embassy', 'consulate'],
    minConfidence: 0.3,
  },
  {
    id: 'immigration_work',
    keywords: ['work permit', 'work visa', 'employment visa', 'job permit'],
    parent: 'immigration',
  },
  {
    id: 'immigration_study',
    keywords: ['student visa', 'study visa', 'university application', 'neptun', 'student permit', 'school'],
    parent: 'immigration',
  },
  {
    id: 'immigration_family',
    keywords: ['family', 'spouse', 'reunification', 'marriage', 'partner', 'children'],
    parent: 'immigration',
  },
  {
    id: 'immigration_asylum',
    keywords: ['asylum', 'refugee', 'protection', 'persecution', 'war', 'humanitarian'],
    parent: 'immigration',
  },
  {
    id: 'housing',
    keywords: ['housing', 'apartment', 'rent', 'flat', 'accommodation', 'lease', 'landlord', 'deposit', 'district', 'ingatlan', 'alberlet'],
    minConfidence: 0.3,
  },
  {
    id: 'jobs',
    keywords: ['job', 'work', 'employ', 'salary', 'career', 'hire', 'cv', 'resume', 'interview', 'profession', 'recruitment'],
    minConfidence: 0.3,
  },
  {
    id: 'cost_of_living',
    keywords: ['cost of living', 'expenses', 'budget', 'price', 'cheap', 'expensive', 'afford', 'salary', 'forint', 'eur', 'money', 'save', 'financial'],
    minConfidence: 0.35,
  },
  {
    id: 'checklist',
    keywords: ['checklist', 'to-do', 'todo', 'tasks', 'things to do', 'what should i do', 'first steps', 'newcomer', 'settle', 'get started'],
    minConfidence: 0.35,
  },
  {
    id: 'city_guide',
    keywords: ['city guide', 'budapest', 'district', 'neighborhood', 'where to live', 'local area', 'move to'],
    minConfidence: 0.35,
  },
  {
    id: 'translate',
    keywords: ['translate', 'translation', 'language', 'meaning', 'how to say', 'in hungarian', 'in english', 'in arabic', 'in french'],
  },
  {
    id: 'healthcare',
    keywords: ['health', 'doctor', 'hospital', 'insurance', 'medical', 'taj', 'clinic', 'pharmacy', 'dentist', 'emergency'],
  },
  {
    id: 'transport',
    keywords: ['transport', 'bus', 'metro', 'train', 'ticket', 'bkk', 'tram', 'subway', 'taxi', 'bicycle'],
  },
  {
    id: 'food',
    keywords: ['food', 'restaurant', 'eat', 'hungarian', 'goulash', 'langos', 'grocery', 'supermarket', 'market', 'cook'],
  },
  {
    id: 'safety',
    keywords: ['safety', 'emergency', 'police', 'danger', 'safe', 'crime', 'ambulance', 'fire', '112', '107', '104', '105'],
  },
  {
    id: 'community',
    keywords: ['community', 'expat', 'group', 'facebook', 'meetup', 'event', 'social', 'friend', 'people'],
  },
  {
    id: 'profile_help',
    keywords: ['my name is', 'i am from', 'i am in', "i'm in", 'i moved', 'i arrived', 'i came', 'moving to', 'relocating'],
    minConfidence: 0.3,
  },
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

export function detectIntent(text, profile) {
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
      results.push({
        id: intent.id,
        parent: intent.parent,
        confidence,
        matchCount: matchedWords,
      });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);

  if (results.length === 0) {
    return { id: 'unknown', confidence: 0, subIntent: null };
  }

  const top = results[0];
  const threshold = INTENTS.find((i) => i.id === top.id)?.minConfidence || 0.2;

  if (top.confidence < threshold) {
    return { id: 'unknown', confidence: top.confidence, subIntent: null };
  }

  const subIntent = results.length > 1 && results[1].parent === top.id ? results[1].id : null;

  return {
    id: top.id,
    confidence: top.confidence,
    subIntent,
    all: results.slice(0, 3),
  };
}

export function shouldEscalateToCommunity(intentResult) {
  return intentResult.id === 'unknown' || intentResult.confidence < CONFIDENCE_THRESHOLD;
}

export function getCommunityMessage(text) {
  return (
    "I'm not entirely sure about that one. Let me suggest asking the Naero Community - " +
    'other newcomers and locals may have the answer!\n\n' +
    'Head over to the Community tab and post your question there. ' +
    'You can also search existing posts to see if someone already asked about:\n' +
    '"' + text + '"'
  );
}
