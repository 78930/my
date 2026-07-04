import React, { useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function Chip({ label, active = false, onPress, icon }: ChipProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function pressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 3,
    }).start();
  }

  function handlePress() {
    Haptics.selectionAsync();
    onPress?.();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: active ? colors.primary : colors.surface,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.border,
          paddingHorizontal: 14,
          paddingVertical: 9,
        }}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={13}
            color={active ? colors.onPrimary : colors.textTertiary}
          />
        ) : null}
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: active ? colors.onPrimary : colors.textSecondary,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
