import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { InputField } from '../../components/ui/InputField';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { UserType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

export default function LoginScreen() {
  const { t } = useTranslation();

  const params = useLocalSearchParams<{ type?: string }>();
  const type = useMemo<UserType>(
    () => (params.type === 'factory' ? 'factory' : 'worker'),
    [params.type]
  );

  const { signIn, isSubmitting } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setError(t('auth.nameRequired'));
      return;
    }

    if (trimmedPhone.replace(/\D/g, '').length < 10) {
      setError(t('auth.phoneRequired'));
      return;
    }

    try {
      await signIn({ role: type, name: trimmedName, phone: trimmedPhone });
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof TypeError && err.message.includes('Network')) {
        setError(t('auth.networkError'));
      } else {
        setError(t('auth.loginFailed'));
      }
    }
  }

  return (
    <Screen>
      <LanguageSelector compact />
      <SectionCard
        title={t('auth.loginAs', {
          type: type === 'factory' ? t('userType.factory') : t('userType.worker'),
        })}
        subtitle={t('auth.loginSubtitle')}
      >
        <InputField
          icon="person-outline"
          placeholder={t('auth.namePlaceholder')}
          value={name}
          onChangeText={setName}
        />

        <InputField
          icon="call-outline"
          placeholder={t('auth.phonePlaceholder')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>

          <Pressable
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryText}>
              {isSubmitting ? t('auth.signingIn') : t('common.continue')}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.link}
          onPress={() =>
            router.replace({ pathname: '/auth/signup', params: { type } })
          }
        >
          <Text style={styles.linkText}>
            {t('auth.createNewAccount', {
              type: type === 'factory' ? t('userType.factory') : t('userType.worker'),
            })}
          </Text>
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
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backText: { color: colors.text, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    opacity: 1,
  },
  primaryText: { color: colors.textInverse, fontWeight: '800' },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 999,
    padding: 12,
  },
  errorText: { color: '#b91c1c', lineHeight: 20 },
  link: { alignItems: 'center', marginTop: 4 },
  linkText: { color: colors.primary, fontWeight: '700' },
  apiHint: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
