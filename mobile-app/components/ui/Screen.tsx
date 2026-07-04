import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RefreshControlProps } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  keyboardAware?: boolean;
}

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  refreshControl,
  keyboardAware = true,
}: ScreenProps) {
  const { colors, spacing } = useTheme();

  const scrollable = scroll ? (
    <ScrollView
      contentContainerStyle={[
        { padding: spacing.screen, gap: spacing.lg, paddingBottom: 40 },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {scrollable}
        </KeyboardAvoidingView>
      ) : (
        scrollable
      )}
    </SafeAreaView>
  );
}
