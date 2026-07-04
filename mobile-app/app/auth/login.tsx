import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Spacer } from '../../components/ui/Spacer';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
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

  const typeLabel = type === 'factory' ? t('userType.factory') : t('userType.worker');

  return (
    <Screen>
      <LanguageSelector compact />

      <Card>
        <Text variant="h2">
          {t('auth.loginAs', { type: typeLabel })}
        </Text>
        <Spacer size="xs" />
        <Text variant="body" color="secondary">
          {t('auth.loginSubtitle')}
        </Text>
        <Spacer size="lg" />

        <Input
          label={t('auth.namePlaceholder')}
          placeholder={t('auth.namePlaceholder')}
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
          autoCapitalize="words"
        />
        <Spacer size="md" />
        <Input
          label={t('auth.phonePlaceholder')}
          placeholder={t('auth.phonePlaceholder')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          leftIcon="call-outline"
          autoCapitalize="none"
        />

        {error ? (
          <>
            <Spacer size="md" />
            <Text variant="label" color="error">{error}</Text>
          </>
        ) : null}

        <Spacer size="lg" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            style={{ flex: 1 }}
          />
          <Button
            label={t('common.continue')}
            onPress={handleLogin}
            variant="primary"
            loading={isSubmitting}
            style={{ flex: 1 }}
          />
        </View>

        <Spacer size="md" />
        <Pressable
          onPress={() =>
            router.replace({ pathname: '/auth/signup', params: { type } })
          }
        >
          <Text variant="label" color="brand" align="center">
            {t('auth.createNewAccount', { type: typeLabel })}
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
