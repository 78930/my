import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Worker } from '../../types';
import { colors } from '../../constants/colors';

export function WorkerCard({ worker, matchScore, onPress }: { worker: Worker; matchScore?: number; onPress?: () => void }) {
  const initial = (worker.name || 'W').charAt(0).toUpperCase();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Header */}
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
          <Text style={styles.role} numberOfLines={1}>{worker.role || 'Industrial Worker'}</Text>
        </View>
        {worker.availableNow ? (
          <View style={styles.availableBadge}>
            <View style={styles.availableDot} />
            <Text style={styles.availableText}>Open</Text>
          </View>
        ) : null}
      </View>

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoBox}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>{worker.area}</Text>
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="briefcase-outline" size={12} color={colors.textMuted} />
          <Text style={styles.infoText}>{worker.experience}</Text>
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.infoText}>{worker.shift}</Text>
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="cash-outline" size={12} color={colors.textMuted} />
          <Text style={styles.infoText}>{worker.salaryPreference}</Text>
        </View>
      </View>

      {/* Match score */}
      {typeof matchScore === 'number' ? (
        <View style={styles.matchBar}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.matchLabel}>{matchScore}% match</Text>
        </View>
      ) : null}

      {/* Skills */}
      {worker.skills.length > 0 ? (
        <View style={styles.skillsRow}>
          {worker.skills.slice(0, 5).map((skill) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {worker.skills.length > 5 ? (
            <View style={styles.skillChip}>
              <Text style={styles.skillText}>+{worker.skills.length - 5}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textInverse, fontWeight: '800', fontSize: 18 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  role: { color: colors.textSoft, marginTop: 2, fontSize: 12 },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0fdf4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  availableText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoText: { color: colors.textSoft, fontWeight: '600', fontSize: 12, flex: 1 },
  matchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchLabel: { color: colors.success, fontWeight: '700', fontSize: 12 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skillText: { color: '#c2410c', fontWeight: '700', fontSize: 11 },
});
