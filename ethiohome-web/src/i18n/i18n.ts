import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './en.json';
import amTranslations from './am.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  am: {
    translation: amTranslations,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
