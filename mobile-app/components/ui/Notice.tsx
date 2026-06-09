import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../constants/colors';

type Variant = 'info' | 'success' | 'error' | 'warning';

const CONFIG = {
  info:    { bg: '#eff6ff', text: '#1d4ed8', icon: 'information-circle-outline'  } as const,
  success: { bg: '#f0fdf4', text: '#15803d', icon: 'checkmark-circle-outline'    } as const,
  error:   { bg: '#fef2f2', text: '#b91c1c', icon: 'close-circle-outline'        } as const,
  warning: { bg: '#fffbeb', text: '#b45309', icon: 'warning-outline'             } as const,
};

type Props = {
  message: string;
  variant?: Variant;
};

export function Notice({ message, variant = 'info' }: Props) {
  if (!message) return null;
  const cfg = CONFIG[variant];
  return (
    <View style={[styles.wrap, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={16} color={cfg.text} />
      <Text style={[styles.text, { color: cfg.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: { flex: 1, lineHeight: 20, fontSize: 13, fontWeight: '600' },
});
