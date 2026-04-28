import * as SecureStore from 'expo-secure-store';
import i18n from './i18n';

const KEY = 'app_language';
export const supportedLanguages = ['en', 'hi', 'te'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];
export const languageLabels: Record<AppLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
};

export async function setAppLanguage(lang: AppLanguage) {
  await SecureStore.setItemAsync(KEY, lang);
  await i18n.changeLanguage(lang);
}

export async function loadAppLanguage() {
  const saved = await SecureStore.getItemAsync(KEY);
  if (saved === 'en' || saved === 'hi' || saved === 'te') {
    await i18n.changeLanguage(saved);
  }
}