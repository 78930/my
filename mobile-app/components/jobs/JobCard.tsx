import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Job } from '../../types';
import { colors } from '../../constants/colors';

export function JobCard({
  job,
  onApply,
  onView,
  onSave,
  isApplying = false,
  isSaved = false,
  disabled = false,
}: {
  job: Job;
  onApply?: () => void;
  onView?: () => void;
  onSave?: () => void;
  isApplying?: boolean;
  isSaved?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{job.role}</Text>
          <Text style={styles.company}>{job.company}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaChip}>{job.area}</Text>
        <Text style={styles.metaChip}>{job.shift}</Text>
        <Text style={styles.metaChip}>{job.pay}</Text>
      </View>

      {job.description ? <Text style={styles.description}>{job.description}</Text> : null}

      <View style={styles.skillsRow}>
        {job.skills.map((skill) => (
          <View key={skill} style={styles.skillChip}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        {onView ? (
          <Pressable style={styles.secondaryButton} onPress={onView}>
            <Text style={styles.secondaryButtonText}>View details</Text>
          </Pressable>
        ) : null}

        {onSave ? (
          <Pressable style={styles.secondaryButton} onPress={onSave}>
            <Text style={styles.secondaryButtonText}>{isSaved ? 'Saved' : 'Save'}</Text>
          </Pressable>
        ) : null}

        {onApply ? (
          <Pressable style={styles.primaryButton} onPress={onApply} disabled={disabled || isApplying}>
            <Text style={styles.primaryButtonText}>{isApplying ? 'Applying...' : 'Apply'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 16 },
  top: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  company: { color: colors.textSoft, marginTop: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaChip: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  description: { color: colors.textSoft, marginTop: 12, lineHeight: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  skillChip: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  skillText: { color: '#c2410c', fontWeight: '600', fontSize: 12 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: { color: colors.textInverse, fontWeight: '700', fontSize: 12 },
});
