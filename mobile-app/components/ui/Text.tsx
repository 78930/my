import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { TypographyVariant } from '../../theme/tokens';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'brand'
  | 'success'
  | 'error'
  | 'warning';

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
}

export function Text({
  variant = 'body',
  color = 'primary',
  align,
  style,
  ...rest
}: AppTextProps) {
  const { colors, typography } = useTheme();

  const colorValue: Record<TextColor, string> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    inverse: colors.onPrimary,
    brand: colors.primary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
  };

  return (
    <RNText
      style={[
        typography[variant],
        { color: colorValue[color] },
        align != null ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
