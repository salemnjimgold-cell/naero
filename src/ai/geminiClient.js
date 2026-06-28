import { GoogleGenerativeAI } from '@google/generative-ai';
import { placeService, serviceService, jobService, communityService, isRealtimeEnabled, searchNearbyPlaces } from '../services';

let genAI = null;
let geminiModel = null;

export function initGemini(apiKey) {
  if (!apiKey || apiKey.length < 10) {
    genAI = null;
    geminiModel = null;
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return true;
  } catch {
    genAI = null;
    geminiModel = null;
    return false;
  }
}

export function isGeminiAvailable() {
  return geminiModel !== null;
}

export async function generateResponse({ message, history, profile, language, location, city }) {
  if (!geminiModel) {
    return null;
  }
  try {
    const profileSections = [];
    if (profile?.name) profileSections.push('Name: ' + profile.name);
    if (profile?.fromCountry) profileSections.push('From: ' + profile.fromCountry);
    if (profile?.toCity) profileSections.push('City: ' + profile.toCity);
    if (profile?.reason) profileSections.push('Reason: ' + profile.reason);
    if (profile?.languages) profileSections.push('Languages: ' + profile.languages);
    if (profile?.hasHousing) profileSections.push('Has Housing: ' + profile.hasHousing);
    if (profile?.hasWork) profileSections.push('Has Work: ' + profile.hasWork);

    const locationSections = [];
    if (city) locationSections.push('User city: ' + city);
    if (location?.latitude) locationSections.push('Latitude: ' + location.latitude);
    if (location?.longitude) locationSections.push('Longitude: ' + location.longitude);

    const appDataSections = [];
    try {
      const [places, services, jobs, alerts] = await Promise.all([
        placeService.getByCity(city || 'Budapest'),
        serviceService.getByCity(city || 'Budapest'),
        jobService.getByCity(city || 'Budapest'),
        communityService.getAlerts(city || 'Budapest'),
      ]);

      if (isRealtimeEnabled() && location?.latitude && location?.longitude) {
        try {
          const livePlaces = await searchNearbyPlaces(location.latitude, location.longitude, 5);
          if (livePlaces.length) {
            appDataSections.push('Live places near user: ' + livePlaces.slice(0, 10).map(p => `${p.name} (${p.category}, ${p.distance?.toFixed(1)}km)`).join(', '));
          }
        } catch {}
      }

      if (places?.data?.length) {
        appDataSections.push('Available places in user city: ' + places.data.slice(0, 10).map(p => `${p.name} (${p.category})`).join(', '));
      }
      if (services?.data?.length) {
        appDataSections.push('Available services: ' + services.data.slice(0, 8).map(s => `${s.name} (${s.category}, ${s.price})`).join(', '));
      }
      if (jobs?.data?.length) {
        appDataSections.push('Available jobs: ' + jobs.data.slice(0, 5).map(j => `${j.title} - ${j.salary}`).join(', '));
      }
      if (alerts?.data?.length) {
        appDataSections.push('Community alerts: ' + alerts.data.slice(0, 3).map(a => a.content.substring(0, 80)).join(' | '));
      }
    } catch {} // data context is optional

    const systemPrompt = 'You are Naero AI, a helpful integration assistant for newcomers to Hungary.\n\n' +
      'Your role:\n' +
      '- Help people moving to Hungary with immigration, housing, jobs, cost of living, culture, language, and daily life.\n' +
      '- Be warm, practical, and precise. Give step-by-step guidance when relevant.\n' +
      '- If the user shares personal details (name, origin, situation), remember them and tailor responses.\n' +
      '- Answer in the user language whenever possible. If they write in Arabic, answer in Arabic. Same for French, Hungarian, English.\n' +
      '- Keep responses concise but complete. Use bullet points for lists.\n' +
      '- Never say you are an AI or LLM. You are Naero AI.\n' +
      '- If you do not know something specific, give general guidance.\n' +
      '- If the user asks about nearby places, hospitals, pharmacies, or services, use their location to provide specific recommendations.\n\n' +
      (profileSections.length > 0
        ? 'User Profile:\n' + profileSections.join('\n')
        : 'The user has not yet set up their profile.') +
      (locationSections.length > 0
        ? '\n\nUser Location:\n' + locationSections.join('\n')
        : '\n\nUser location is not available. If asked about nearby places, ask the user to enable location.') +
      (language && language !== 'en'
        ? '\n\nThe user prefers communicating in: ' + (language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : language === 'hu' ? 'Hungarian' : 'English') + '. Adapt your responses accordingly.'
        : '') +
      (appDataSections.length > 0
        ? '\n\nApp Data Context:\n' + appDataSections.join('\n')
        : '');

    const chatHistory = (history || []).slice(-20).map((entry) => {
      const mappedRole = entry.role === 'assistant' ? 'model' : 'user';
      return {
        role: mappedRole,
        parts: [{ text: entry.content }],
      };
    });
    const chat = geminiModel.startChat({
      history: chatHistory,
      systemInstruction: systemPrompt,
    });
    const result = await chat.sendMessage(message);
    const text = result.response.text();
    return text || null;
  } catch {
    return null;
  }
}

export async function generateStreamingResponse({ message, history, profile, language, onChunk }) {
  if (!geminiModel || !onChunk) return null;
  try {
    const profileSections = [];
    if (profile?.name) profileSections.push('Name: ' + profile.name);
    if (profile?.fromCountry) profileSections.push('From: ' + profile.fromCountry);
    if (profile?.toCity) profileSections.push('City: ' + profile.toCity);
    if (profile?.reason) profileSections.push('Reason: ' + profile.reason);

    const systemPrompt = 'You are Naero AI, a helpful integration assistant for newcomers to Hungary. ' +
      (profileSections.length > 0 ? '\n\nUser Profile:\n' + profileSections.join('\n') : '');

    const chatHistory = (history || []).slice(-20).map((entry) => ({
      role: entry.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: entry.content }],
    }));

    const chat = geminiModel.startChat({
      history: chatHistory,
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessageStream(message);
    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(fullText);
    }
    return fullText || null;
  } catch {
    return null;
  }
}
