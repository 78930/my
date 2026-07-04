import React, { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  containerStyle,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const hasError = Boolean(error);
  const isMultiline = Boolean(rest.multiline);
  const borderColor = hasError
    ? colors.error
    : focused
    ? colors.primary
    : colors.border;
  const borderWidth = focused || hasError ? 2 : 1;
  const iconColor = hasError
    ? colors.error
    : focused
    ? colors.primary
    : colors.textTertiary;

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.textSecondary,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: isMultiline ? 'flex-start' : 'center',
          ...(isMultiline ? { minHeight: 52, paddingVertical: 14 } : { height: 52 }),
          borderRadius: 12,
          borderWidth,
          borderColor,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={iconColor}
            style={isMultiline ? { marginTop: 2 } : undefined}
          />
        ) : null}

        <TextInput
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.textTertiary}
          style={[
            {
              flex: 1,
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.textPrimary,
              paddingVertical: 0,
              ...(isMultiline ? { minHeight: 80, textAlignVertical: 'top' } : {}),
            },
            style,
          ]}
          {...rest}
        />

        {rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Ionicons name={rightIcon} size={18} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      {error || helper ? (
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: hasError ? colors.error : colors.textTertiary,
            paddingHorizontal: 2,
          }}
        >
          {error ?? helper}
        </Text>
      ) : null}
    </View>
  );
}
