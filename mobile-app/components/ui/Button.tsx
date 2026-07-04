import React, { useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Pressable,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_CONFIG = {
  sm: { height: 36, paddingH: 14, fontSize: 13, iconSize: 14 },
  md: { height: 48, paddingH: 20, fontSize: 15, iconSize: 16 },
  lg: { height: 56, paddingH: 24, fontSize: 16, iconSize: 18 },
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const variantConfig = {
    primary: {
      bg: colors.primary,
      text: colors.onPrimary,
      border: 'transparent' as const,
    },
    secondary: {
      bg: colors.primarySoft,
      text: colors.primary,
      border: 'transparent' as const,
    },
    ghost: {
      bg: 'transparent' as const,
      text: colors.textPrimary,
      border: colors.border,
    },
    destructive: {
      bg: colors.errorSoft,
      text: colors.error,
      border: 'transparent' as const,
    },
  }[variant];

  const sz = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
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
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }, style]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: sz.height,
          paddingHorizontal: sz.paddingH,
          backgroundColor: variantConfig.bg,
          borderRadius: 14,
          borderWidth: variantConfig.border !== 'transparent' ? 1 : 0,
          borderColor: variantConfig.border,
          opacity: isDisabled ? 0.55 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantConfig.text} />
        ) : (
          <>
            {leftIcon ? (
              <Ionicons name={leftIcon} size={sz.iconSize} color={variantConfig.text} />
            ) : null}
            <Text
              style={{
                fontSize: sz.fontSize,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: variantConfig.text,
              }}
            >
              {label}
            </Text>
            {rightIcon ? (
              <Ionicons name={rightIcon} size={sz.iconSize} color={variantConfig.text} />
            ) : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
