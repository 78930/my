import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
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
      </Stack>
    </AuthProvider>
  );
}
