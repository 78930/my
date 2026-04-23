import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../constants/colors';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
};

export function StatCard({ icon, value, label }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.panelSoft,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249,115,22,0.14)',
    marginBottom: 10,
  },
  value: {
    color: colors.textInverse,
    fontSize: 20,
    fontWeight: '800',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
