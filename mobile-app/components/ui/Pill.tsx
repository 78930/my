import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/colors';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function Pill({ label, active = false, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.base, active && styles.active]}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  textActive: {
    color: colors.textInverse,
  },
});
