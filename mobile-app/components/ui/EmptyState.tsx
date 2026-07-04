import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({
  icon = 'search-outline',
  title,
  message,
  action,
}: EmptyStateProps) {
  const { colors, spacing, radii } = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        padding: spacing['2xl'],
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radii.lg,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>

      <Text variant="h3" align="center">
        {title}
      </Text>

      {message ? (
        <Text variant="body" color="secondary" align="center">
          {message}
        </Text>
      ) : null}

      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="secondary"
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}
