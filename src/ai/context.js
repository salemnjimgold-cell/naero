const MAX_HISTORY = 20;

export class ConversationContext {
  constructor() {
    this.history = [];
    this.currentTopic = null;
    this.userAskedForMore = false;
    this.consecutiveUnknowns = 0;
    this.greeted = false;
  }

  addEntry(role, content, intent) {
    this.history.push({ role, content, intent, timestamp: Date.now() });
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY);
    }
    if (intent && intent.id !== 'unknown') {
      this.currentTopic = intent;
      this.consecutiveUnknowns = 0;
    } else if (!intent || intent.id === 'unknown') {
      this.consecutiveUnknowns++;
    }
  }

  getRecentTopics() {
    const topics = this.history
      .filter((e) => e.intent && e.intent.id !== 'unknown' && e.role === 'user')
      .map((e) => e.intent.id);
    return [...new Set(topics)].slice(-3);
  }

  isAskingFollowUp(text) {
    const lower = text.toLowerCase();
    const followUpWords = ['more', 'tell me', 'explain', 'details', 'elaborate', 'also', 'and', 'next', 'then what'];
    return followUpWords.some((w) => lower.includes(w));
  }

  shouldSuggestOnboarding(profile) {
    if (!profile) return true;
    const filled = Object.values(profile).filter((v) => v && v !== '').length;
    return filled < 2 && this.history.length < 4;
  }

  reset() {
    this.history = [];
    this.currentTopic = null;
    this.userAskedForMore = false;
    this.consecutiveUnknowns = 0;
  }
}
