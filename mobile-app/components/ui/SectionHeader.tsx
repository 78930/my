import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'PlusJakartaSans_700Bold',
          color: colors.textPrimary,
        }}
      >
        {title}
      </Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.primary,
            }}
          >
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
