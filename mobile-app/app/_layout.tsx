import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import '../lib/i18n';
import { loadAppLanguage } from '../lib/language';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAppLanguage().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="factory/pipeline" />
          <Stack.Screen name="factory/post-job" />
          <Stack.Screen name="factory/my-jobs" />
          <Stack.Screen name="factory/edit-job" />
          <Stack.Screen name="factory/application/[id]" />
          <Stack.Screen name="jobs/[id]" />
          <Stack.Screen name="worker/[id]" />
          <Stack.Screen name="worker/applications" />
          <Stack.Screen name="worker/saved" />
          <Stack.Screen name="worker/hire/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="notifications" />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}
