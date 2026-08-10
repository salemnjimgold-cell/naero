import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';
import fr from './fr.json';
import hu from './hu.json';
import contextual from './contextual';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...en, contextual: contextual.en } },
    ar: { translation: { ...ar, contextual: contextual.ar } },
    fr: { translation: { ...fr, contextual: contextual.fr } },
    hu: { translation: { ...hu, contextual: contextual.hu } },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

export default i18n;
