import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import '../lib/i18n';
import { loadAppLanguage } from '../lib/language';
import { registerForPushNotifications } from '../lib/notifications';

// Hold the native splash screen until both fonts and i18n are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [langReady, setLangReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    loadAppLanguage().then(() => setLangReady(true));
    registerForPushNotifications();
  }, []);

  const ready = (fontsLoaded || fontError !== null) && langReady;

  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Keep native splash visible until ready; render nothing so JS splash
  // from index.tsx never competes with it.
  if (!ready) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="auth/language-select" />
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
      </ThemeProvider>
    </View>
  );
}
