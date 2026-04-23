import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { InputField } from '../../components/ui/InputField';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { UserType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = useMemo<UserType>(() => (params.type === 'factory' ? 'factory' : 'worker'), [params.type]);

  const { signIn, isSubmitting } = useAuth();
  const [email, setEmail] = useState(type === 'factory' ? 'factory@sketu.app' : 'worker@sketu.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    try {
      await signIn({ email, password });
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      setError(message);
    }
  }

  return (
    <Screen>
      <SectionCard
        title={`Login as ${type === 'factory' ? 'Factory' : 'Worker'}`}
        subtitle="Connected to the Sketu backend API. Use a registered email and password."
      >
        <InputField icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} />
        <InputField
          icon="lock-closed-outline"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={isSubmitting}>
            <Text style={styles.primaryText}>{isSubmitting ? 'Signing in...' : 'Continue'}</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.link}
          onPress={() => router.replace({ pathname: '/auth/signup', params: { type } })}
        >
          <Text style={styles.linkText}>Create a new {type} account</Text>
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
    opacity: 1,
  },
  primaryText: { color: colors.textInverse, fontWeight: '800' },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 12,
  },
  errorText: { color: '#b91c1c', lineHeight: 20 },
  link: { alignItems: 'center', marginTop: 4 },
  linkText: { color: colors.primary, fontWeight: '700' },
});
