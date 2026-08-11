import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';
import fr from './fr.json';
import hu from './hu.json';
import contextual from './contextual';
import compass3c from './compass3c';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...en, contextual: contextual.en, compass3c: compass3c.en } },
    ar: { translation: { ...ar, contextual: contextual.ar, compass3c: compass3c.ar } },
    fr: { translation: { ...fr, contextual: contextual.fr, compass3c: compass3c.fr } },
    hu: { translation: { ...hu, contextual: contextual.hu, compass3c: compass3c.hu } },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

export default i18n;
