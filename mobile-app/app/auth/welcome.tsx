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
    <Screen contentContainerStyle={styles.screenContent}>

      {/* Top: Branding */}
      <View>
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
      </View>

      {/* Bottom: Role selection card */}
      <View style={styles.selectWrap}>
        <Text style={styles.selectTitle}>{t('auth.chooseUsage')}</Text>

        <View style={styles.optionRow}>
          {/* Worker card */}
          <Pressable
            onPress={() => router.push({ pathname: '/auth/login', params: { type: 'worker' } })}
            style={[styles.choiceCard, styles.choiceOrange]}
          >
            <View style={[styles.iconWrap, styles.iconOrange]}>
              <Ionicons name="person-outline" size={26} color={colors.primary} />
            </View>
            <View style={styles.choiceTextWrap}>
              <Text style={styles.choiceTitle}>{t('userType.worker')}</Text>
              <Text style={styles.choiceText}>{t('auth.workerChoiceText')}</Text>
              <Text style={styles.choiceAction}>{t('auth.loginAsWorker')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>

          {/* Factory card */}
          <Pressable
            onPress={() => router.push({ pathname: '/auth/login', params: { type: 'factory' } })}
            style={[styles.choiceCard, styles.choiceDark]}
          >
            <View style={[styles.iconWrap, styles.iconDark]}>
              <Ionicons name="business-outline" size={26} color={colors.panel} />
            </View>
            <View style={styles.choiceTextWrap}>
              <Text style={styles.choiceTitle}>{t('userType.factory')}</Text>
              <Text style={styles.choiceText}>{t('auth.factoryChoiceText')}</Text>
              <Text style={styles.choiceAction}>{t('auth.loginAsFactory')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSoft} />
          </Pressable>
        </View>

        {/* Sign-up buttons */}
        <View style={styles.buttonsRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push({ pathname: '/auth/signup', params: { type: 'worker' } })}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.textInverse} style={styles.btnIcon} />
            <Text style={styles.secondaryButtonText}>{t('auth.workerSignup')}</Text>
          </Pressable>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/auth/signup', params: { type: 'factory' } })}
          >
            <Ionicons name="business-outline" size={16} color={colors.textInverse} style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>{t('auth.factorySignup')}</Text>
          </Pressable>
        </View>
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: { color: colors.textInverse, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  cityBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cityText: { color: colors.textInverse, fontWeight: '700', fontSize: 12 },

  /* Role selection card */
  selectWrap: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  selectTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },

  optionRow: { flexDirection: 'column', gap: 12, flex: 1 },

  choiceCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  choiceOrange: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  choiceDark:   { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOrange: { backgroundColor: 'rgba(249,115,22,0.12)' },
  iconDark:   { backgroundColor: 'rgba(15,23,42,0.07)' },

  choiceTextWrap: { flex: 1 },
  choiceTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  choiceText:  { color: colors.textSoft, marginTop: 3, lineHeight: 18, fontSize: 12 },
  choiceAction:{ color: colors.primary, marginTop: 6, fontWeight: '700', fontSize: 12 },

  /* Sign-up buttons */
  buttonsRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 6,
  },
  secondaryButtonText: { color: colors.textInverse, fontWeight: '800', fontSize: 14 },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 6,
  },
  primaryButtonText: { color: colors.textInverse, fontWeight: '800', fontSize: 14 },
  btnIcon: { marginRight: 2 },
});
