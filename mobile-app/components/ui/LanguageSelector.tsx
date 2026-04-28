import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import { AppLanguage, languageLabels, setAppLanguage, supportedLanguages } from '../../lib/language';

type Props = {
  compact?: boolean;
};

export function LanguageSelector({ compact = false }: Props) {
  const { t, i18n } = useTranslation();

  const currentLanguage = supportedLanguages.includes(i18n.language as AppLanguage)
    ? (i18n.language as AppLanguage)
    : 'en';

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={styles.title}>{t('settings.languagePreference')}</Text>
      <Text style={styles.subtitle}>
        {t('settings.currentLanguage', { language: languageLabels[currentLanguage] })}
      </Text>

      <View style={styles.optionsRow}>
        {supportedLanguages.map((language) => (
          <Pressable
            key={language}
            style={[styles.option, currentLanguage === language && styles.optionActive]}
            onPress={() => setAppLanguage(language)}
          >
            <Text style={[styles.optionText, currentLanguage === language && styles.optionTextActive]}>
              {t(`settings.${language === 'en' ? 'english' : language === 'hi' ? 'hindi' : 'telugu'}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  containerCompact: {
    padding: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f8fafc',
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    color: colors.text,
    fontWeight: '700',
  },
  optionTextActive: {
    color: colors.primary,
  },
});
