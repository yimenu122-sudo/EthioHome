/**
 * @file index.js
 * @description Internationalization (i18n) loader and helper for EthioHome
 */

const en = require('./en.json');
const am = require('./am.json');

const translations = {
  en,
  am
};

/**
 * Get translation for a specific key and language
 * @param {string} key - The translation key
 * @param {string} lang - The language code (en, am)
 * @returns {string} - The translated string or the key if not found
 */
const translate = (key, lang = 'en') => {
  const selectedLang = translations[lang] || translations['en'];
  return selectedLang[key] || en[key] || key;
};

/**
 * Get both English and Amharic translations for a key
 * Useful for the standardized ResponseUtil
 * @param {string} key - The translation key
 * @returns {object} - { message_en, message_am }
 */
const getDualMessage = (key) => {
  return {
    message_en: en[key] || key,
    message_am: am[key] || en[key] || key
  };
};

module.exports = {
  translate,
  getDualMessage,
  translations
};
