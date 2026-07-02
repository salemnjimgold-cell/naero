const { TEMPLATES } = require('./templates');

function createPromptService() {
  function getTemplate(topic) {
    const key = (topic || '').toLowerCase().replace(/[\s-]+/g, '_');
    return TEMPLATES[key] || TEMPLATES.general_assistant;
  }

  function buildSystemPrompt(topic, context) {
    const template = getTemplate(topic);
    const contextStr = context ? `\n\n## Current Context\n${context}` : '';
    return `${template.system}${contextStr}`;
  }

  function buildMessages(topic, userMessage, context, history) {
    const systemPrompt = buildSystemPrompt(topic, context);
    const messages = [{ role: 'system', content: systemPrompt }];

    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const h of recentHistory) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    messages.push({ role: 'user', content: userMessage });
    return messages;
  }

  function getTemplateInfo() {
    return Object.entries(TEMPLATES).map(([key, t]) => ({
      id: key,
      name: t.name,
      description: t.description,
      topics: t.topics,
    }));
  }

  return {
    getTemplate,
    buildSystemPrompt,
    buildMessages,
    getTemplateInfo,
  };
}

module.exports = { createPromptService };
