import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/ui/Screen';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../constants/colors';
import { languageLabels, setAppLanguage, supportedLanguages } from '../lib/language';

const LANG_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  en: 'language-outline',
  hi: 'chatbubble-ellipses-outline',
  te: 'chatbubble-outline',
};

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  const currentLanguage = supportedLanguages.includes(i18n.language as (typeof supportedLanguages)[number])
    ? (i18n.language as (typeof supportedLanguages)[number])
    : 'en';

  return (
    <Screen>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <SectionCard title="Language" subtitle="Choose the app display language">
        {supportedLanguages.map((lang) => {
          const active = currentLanguage === lang;
          return (
            <Pressable
              key={lang}
              style={[styles.langRow, active && styles.langRowActive]}
              onPress={() => setAppLanguage(lang)}
            >
              <View style={[styles.langIcon, active && styles.langIconActive]}>
                <Ionicons
                  name={LANG_ICONS[lang] ?? 'language-outline'}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.langName, active && styles.langNameActive]}>
                  {languageLabels[lang]}
                </Text>
                <Text style={styles.langCode}>{lang.toUpperCase()}</Text>
              </View>
              {active ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : (
                <View style={styles.emptyCheck} />
              )}
            </Pressable>
          );
        })}
      </SectionCard>

      <SectionCard title="About">
        <View style={styles.aboutRow}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutLabel}>Sketu</Text>
            <Text style={styles.aboutValue}>Industrial hiring platform for Hyderabad</Text>
          </View>
        </View>
        <View style={styles.aboutRow}>
          <Ionicons name="code-slash-outline" size={20} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: colors.textInverse, fontSize: 20, fontWeight: '800' },
  iconButton: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.panel,
    alignItems: 'center', justifyContent: 'center',
  },
  spacer: { width: 42 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  langRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#eff6ff',
  },
  langIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  langIconActive: { backgroundColor: '#dbeafe' },
  langName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  langNameActive: { color: colors.primary },
  langCode: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyCheck: { width: 20, height: 20 },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  aboutLabel: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  aboutValue: { color: colors.textSoft, fontSize: 13 },
});
