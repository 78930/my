import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Text } from '../components/ui/Text';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function IndexPage() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingSeen, setOnboardingSeen] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_v2_seen')
      .then((val) => setOnboardingSeen(val === '1'))
      .catch(() => setOnboardingSeen(false))
      .finally(() => setCheckingOnboarding(false));
  }, []);

  if (isLoading || checkingOnboarding) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#1240C7',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        {/* S logo mark: two arc views */}
        <View style={{ width: 72, height: 72 }}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 50,
              height: 50,
              borderRadius: 25,
              borderWidth: 8,
              borderColor: '#5B8DFF',
              borderRightColor: 'transparent',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 25 - 5,
              left: 42,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#FF8C00',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 50,
              height: 50,
              borderRadius: 25,
              borderWidth: 8,
              borderColor: '#FF8C00',
              borderLeftColor: 'transparent',
            }}
          />
        </View>

        {/* Wordmark */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text
            variant="display"
            style={{ color: '#FFFFFF', letterSpacing: -1 }}
          >
            Ske
          </Text>
          <Text
            variant="display"
            style={{ color: '#FF8C00', letterSpacing: -1 }}
          >
            tu
          </Text>
        </View>

        <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
      </View>
    );
  }

  if (!onboardingSeen) {
    return <Redirect href="/onboarding" />;
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/welcome" />;
}
