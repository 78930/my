import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  pressable?: boolean;
  onPress?: () => void;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  pressable = false,
  onPress,
  padding,
  style,
}: CardProps) {
  const { colors, spacing, radii, shadows } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const baseStyle: ViewStyle = {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padding ?? spacing.lg,
    ...shadows.card,
  };

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.98,
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
      bounciness: 2,
    }).start();
  }

  function handlePress() {
    Haptics.selectionAsync();
    onPress?.();
  }

  if (pressable || onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={baseStyle}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}
