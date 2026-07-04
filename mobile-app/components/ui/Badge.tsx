import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type BadgeVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'brand';

type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'HIRED' | 'REJECTED';

const STATUS_MAP: Record<ApplicationStatus, BadgeVariant> = {
  APPLIED: 'neutral',
  SHORTLISTED: 'info',
  HIRED: 'success',
  REJECTED: 'error',
};

export function statusToBadgeVariant(status: string): BadgeVariant {
  return STATUS_MAP[status as ApplicationStatus] ?? 'neutral';
}

export interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  status?: ApplicationStatus;
  size?: 'sm' | 'md';
}

export function Badge({ label, variant, status, size = 'md' }: BadgeProps) {
  const { colors } = useTheme();

  const resolvedVariant: BadgeVariant =
    variant ?? (status ? statusToBadgeVariant(status) : 'neutral');

  const config: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: colors.successSoft, text: colors.success },
    error:   { bg: colors.errorSoft,   text: colors.error   },
    warning: { bg: colors.warningSoft, text: colors.warning },
    info:    { bg: colors.infoSoft,    text: colors.info    },
    neutral: { bg: colors.surface,     text: colors.textSecondary },
    brand:   { bg: colors.primarySoft, text: colors.primary },
  };

  const c = config[resolvedVariant];
  const resolvedLabel = label ?? status ?? '';
  const fontSize = size === 'sm' ? 11 : 12;
  const paddingH = size === 'sm' ? 8 : 10;
  const paddingV = size === 'sm' ? 3 : 5;

  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: 999,
        paddingHorizontal: paddingH,
        paddingVertical: paddingV,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize,
          fontFamily: 'PlusJakartaSans_600SemiBold',
          color: c.text,
          letterSpacing: 0.3,
        }}
      >
        {resolvedLabel}
      </Text>
    </View>
  );
}
