import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { InputField } from '../../components/ui/InputField';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function OtpLoginScreen() {
  const { t } = useTranslation();
  const { requestOtp, signInWithOtp, isSubmitting } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [helper, setHelper] = useState('');
  const [error, setError] = useState('');

  async function handleRequestOtp() {
    setError('');
    setHelper('');
    try {
      const result = await requestOtp({ phone });
      setOtpRequested(true);
      if (result.otpCode) {
        setHelper(t('auth.devOtpHint', { otp: result.otpCode }));
      } else {
        setHelper(t('auth.otpSent'));
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('auth.otpRequestFailed');
      setError(message);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    setHelper('');
    try {
      await signInWithOtp({ phone, otp });
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('auth.otpVerifyFailed');
      setError(message);
    }
  }

  return (
    <Screen>
      <LanguageSelector compact />
      <SectionCard title={t('auth.otpLoginTitle')} subtitle={t('auth.otpLoginSubtitle')}>
        <InputField
          icon="call-outline"
          placeholder={t('auth.phonePlaceholder')}
          value={phone}
          onChangeText={setPhone}
        />

        <InputField
          icon="key-outline"
          placeholder={t('auth.otpPlaceholder')}
          value={otp}
          onChangeText={setOtp}
        />

        {helper ? (
          <View style={styles.helperBox}>
            <Text style={styles.helperText}>{helper}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleRequestOtp} disabled={isSubmitting}>
            <Text style={styles.primaryText}>
              {isSubmitting ? t('auth.requestingOtp') : otpRequested ? t('auth.resendOtp') : t('auth.sendOtp')}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.verifyButton} onPress={handleVerifyOtp} disabled={isSubmitting || !otpRequested}>
          <Text style={styles.verifyText}>{isSubmitting ? t('auth.verifyingOtp') : t('auth.verifyOtp')}</Text>
        </Pressable>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  backButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backText: { color: colors.text, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: colors.textInverse, fontWeight: '800' },
  verifyButton: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  verifyText: { color: colors.textInverse, fontWeight: '800' },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 12,
  },
  errorText: { color: '#b91c1c', lineHeight: 20 },
  helperBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 12,
  },
  helperText: {
    color: '#1d4ed8',
    lineHeight: 20,
  },
});
