import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import '../lib/i18n';
import { loadAppLanguage } from '../lib/language';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      await loadAppLanguage();
      setReady(true);
    };

    initApp();
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="factory/pipeline" />
        <Stack.Screen name="jobs/[id]" />
        <Stack.Screen name="worker/applications" />
        <Stack.Screen name="worker/saved" />
        <Stack.Screen name="settings" />
      </Stack>
    </AuthProvider>
  );
}