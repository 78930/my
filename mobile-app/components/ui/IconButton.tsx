import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface IconButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  size?: number;
  color?: string;
  accessibilityLabel: string;
  variant?: 'default' | 'filled' | 'ghost';
}

export function IconButton({
  icon,
  onPress,
  size = 22,
  color,
  accessibilityLabel,
  variant = 'default',
}: IconButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.88,
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
      bounciness: 4,
    }).start();
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const bg =
    variant === 'filled'
      ? colors.primary
      : variant === 'ghost'
      ? 'transparent'
      : colors.surface;

  const resolvedColor =
    color ?? (variant === 'filled' ? colors.onPrimary : colors.textPrimary);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={size} color={resolvedColor} />
      </Pressable>
    </Animated.View>
  );
}
