import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { InputField } from '../../components/ui/InputField';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { Pill } from '../../components/ui/Pill';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { industrialAreas } from '../../constants/areas';
import { allRoles } from '../../constants/roles';
import { UserType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

export default function SignupScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ type?: string }>();
  const type = useMemo<UserType>(() => (params.type === 'factory' ? 'factory' : 'worker'), [params.type]);

  const { signUpWorker, signUpFactory, isSubmitting } = useAuth();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hrName, setHrName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [selectedArea, setSelectedArea] = useState('Jeedimetla');
  const [selectedRole, setSelectedRole] = useState(
    type === 'factory' ? 'Plant Head / Factory Head' : 'Production Supervisor'
  );
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function handleSignup() {
    setError('');
    try {
      if (type === 'factory') {
        await signUpFactory({
          companyName: companyName || 'Sketu Factory',
          hrName: hrName || 'HR Manager',
          email,
          phone,
          password,
          industrialAreas: [selectedArea],
          description,
        });
      } else {
        await signUpWorker({
          fullName: fullName || 'Sketu Worker',
          email,
          phone,
          password,
          preferredAreas: [selectedArea],
          preferredRoles: [selectedRole],
          skills: [],
          preferredShifts: ['General'],
        });
      }
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('auth.signupFailed');
      setError(message);
    }
  }

  return (
    <Screen>
      <LanguageSelector compact />
      <SectionCard
        title={t('auth.createAccountAs', {
          type: type === 'factory' ? t('userType.factory') : t('userType.worker'),
        })}
        subtitle={t('auth.signupSubtitle')}
      >
        {type === 'factory' ? (
          <>
            <InputField
              icon="business-outline"
              placeholder={t('auth.companyNamePlaceholder')}
              value={companyName}
              onChangeText={setCompanyName}
            />
            <InputField
              icon="person-outline"
              placeholder={t('auth.hrNamePlaceholder')}
              value={hrName}
              onChangeText={setHrName}
            />
          </>
        ) : (
          <InputField
            icon="person-outline"
            placeholder={t('auth.fullNamePlaceholder')}
            value={fullName}
            onChangeText={setFullName}
          />
        )}

        <InputField icon="mail-outline" placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} />
        <InputField icon="call-outline" placeholder={t('auth.phonePlaceholder')} value={phone} onChangeText={setPhone} />
        <InputField
          icon="lock-closed-outline"
          placeholder={t('auth.createPasswordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {type === 'factory' ? (
          <InputField
            icon="document-text-outline"
            placeholder={t('auth.factoryDescriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
          />
        ) : null}

        <View>
          <Text style={styles.label}>
            {type === 'factory' ? t('auth.industrialArea') : t('auth.preferredIndustrialArea')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {industrialAreas.map((area) => (
              <Pill
                key={area}
                label={area}
                active={selectedArea === area}
                onPress={() => setSelectedArea(area)}
              />
            ))}
          </ScrollView>
        </View>

        {type === 'worker' ? (
          <View>
            <Text style={styles.label}>{t('auth.primaryRole')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {allRoles.slice(0, 20).map((role) => (
                <Pill
                  key={role}
                  label={role}
                  active={selectedRole === role}
                  onPress={() => setSelectedRole(role)}
                />
              ))}
            </ScrollView>
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
          <Pressable style={styles.primaryButton} onPress={handleSignup} disabled={isSubmitting}>
            <Text style={styles.primaryText}>{isSubmitting ? t('auth.creating') : t('auth.createAccount')}</Text>
          </Pressable>
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontWeight: '700', marginBottom: 8 },
  chips: { gap: 8 },
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
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 12,
  },
  errorText: { color: '#b91c1c', lineHeight: 20 },
});
