import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/ui/Screen';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { colors } from '../../constants/colors';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Sketu</Text>
          <Text style={styles.sub}>{t('auth.welcomeSubtitle')}</Text>
        </View>
        <View style={styles.cityBadge}>
          <Text style={styles.cityText}></Text>
        </View>
      </View>

      <LanguageSelector />

      <View style={styles.selectWrap}>
        <Text style={styles.selectTitle}>{t('auth.chooseUsage')}</Text>

        <View style={styles.optionRow}>
          <Pressable
            onPress={() => router.push({ pathname: '/auth/login', params: { type: 'worker' } })}
            style={[styles.choiceCard, styles.choiceOrange]}
          >
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.choiceTitle}>{t('userType.worker')}</Text>
            <Text style={styles.choiceText}>{t('auth.workerChoiceText')}</Text>
            <Text style={styles.choiceAction}>{t('auth.loginAsWorker')}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: '/auth/login', params: { type: 'factory' } })}
            style={[styles.choiceCard, styles.choiceDark]}
          >
            <Ionicons name="business-outline" size={24} color={colors.panel} />
            <Text style={styles.choiceTitle}>{t('userType.factory')}</Text>
            <Text style={styles.choiceText}>{t('auth.factoryChoiceText')}</Text>
            <Text style={styles.choiceAction}>{t('auth.loginAsFactory')}</Text>
          </Pressable>
        </View>

        <View style={styles.buttonsRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push({ pathname: '/auth/signup', params: { type: 'worker' } })}
          >
            <Text style={styles.secondaryButtonText}>{t('auth.workerSignup')}</Text>
          </Pressable>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/auth/signup', params: { type: 'factory' } })}
          >
            <Text style={styles.primaryButtonText}>{t('auth.factorySignup')}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.textInverse, fontSize: 30, fontWeight: '800' },
  sub: { color: colors.textMuted, marginTop: 4 },
  cityBadge: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  cityText: { color: colors.textInverse, fontWeight: '700', fontSize: 12 },
  selectWrap: { backgroundColor: colors.card, borderRadius: 28, padding: 16, gap: 12 },
  selectTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  optionRow: { flexDirection: 'row', gap: 12 },
  choiceCard: { flex: 1, borderRadius: 24, padding: 16, borderWidth: 1 },
  choiceOrange: { backgroundColor: colors.primarySoft, borderColor: '#fdba74' },
  choiceDark: { backgroundColor: '#f8fafc', borderColor: colors.border },
  choiceTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 },
  choiceText: { color: colors.textSoft, marginTop: 6, lineHeight: 19, fontSize: 12 },
  choiceAction: { color: colors.primary, marginTop: 12, fontWeight: '700', fontSize: 12 },
  buttonsRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: { color: colors.textInverse, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: { color: colors.textInverse, fontWeight: '800' },
});
