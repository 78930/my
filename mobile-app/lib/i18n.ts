import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import te from '../locales/te.json';

const deviceLanguage =
  Localization.getLocales()?.[0]?.languageCode || 'en';

const supportedLanguages = ['en', 'hi', 'te'];
const fallbackLanguage = supportedLanguages.includes(deviceLanguage)
  ? deviceLanguage
  : 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    te: { translation: te }
  },
  lng: fallbackLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;