import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { languageLabels, setAppLanguage, supportedLanguages } from '../lib/language';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  const currentLanguage = supportedLanguages.includes(i18n.language as (typeof supportedLanguages)[number])
    ? (i18n.language as (typeof supportedLanguages)[number])
    : 'en';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.languagePreference')}</Text>
      <Text style={styles.subtitle}>
        {t('settings.currentLanguage', { language: languageLabels[currentLanguage] })}
      </Text>

      {supportedLanguages.map((language) => (
        <TouchableOpacity
          key={language}
          style={[styles.card, currentLanguage === language && styles.cardActive]}
          onPress={() => setAppLanguage(language)}
        >
          <Text style={[styles.label, currentLanguage === language && styles.active]}>
            {t(`settings.${language === 'en' ? 'english' : language === 'hi' ? 'hindi' : 'telugu'}`)}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>{t('common.back')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#bbb',
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardActive: {
    borderColor: '#4da6ff',
    backgroundColor: '#162235',
  },
  label: {
    fontSize: 18,
    color: '#ccc',
  },
  active: {
    color: '#4da6ff',
    fontWeight: '700',
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
