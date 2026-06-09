import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
          <Text style={styles.title} numberOfLines={1}>{job.role}</Text>
          <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
        </View>
        {onSave ? (
          <Pressable onPress={onSave} style={styles.saveBtn} hitSlop={8}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? colors.primary : colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="location-outline" size={11} color="#64748b" />
          <Text style={styles.metaText}>{job.area}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="time-outline" size={11} color="#64748b" />
          <Text style={styles.metaText}>{job.shift}</Text>
        </View>
        <View style={[styles.metaChip, styles.payChip]}>
          <Ionicons name="cash-outline" size={11} color="#15803d" />
          <Text style={[styles.metaText, styles.payText]}>{job.pay}</Text>
        </View>
      </View>

      {job.description ? (
        <Text style={styles.description} numberOfLines={2}>{job.description}</Text>
      ) : null}

      {job.skills.length > 0 ? (
        <View style={styles.skillsRow}>
          {job.skills.slice(0, 5).map((skill) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {job.skills.length > 5 ? (
            <View style={styles.skillChip}>
              <Text style={styles.skillText}>+{job.skills.length - 5}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        {onView ? (
          <Pressable style={styles.viewButton} onPress={onView}>
            <Text style={styles.viewButtonText}>Details</Text>
          </Pressable>
        ) : null}

        {onApply ? (
          <Pressable
            style={[styles.applyButton, (disabled || isApplying) && styles.applyButtonDisabled]}
            onPress={onApply}
            disabled={disabled || isApplying}
          >
            {isApplying ? (
              <Text style={styles.applyButtonText}>Applying...</Text>
            ) : (
              <>
                <Ionicons name="send-outline" size={13} color={colors.textInverse} />
                <Text style={styles.applyButtonText}>Apply</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16, lineHeight: 22 },
  company: { color: colors.textSoft, marginTop: 2, fontSize: 13 },
  saveBtn: { padding: 4, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  payChip: { backgroundColor: '#f0fdf4' },
  metaText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  payText: { color: '#15803d' },
  description: { color: colors.textSoft, lineHeight: 20, fontSize: 13 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skillText: { color: '#c2410c', fontWeight: '700', fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  viewButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  viewButtonText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingVertical: 10,
  },
  applyButtonDisabled: { opacity: 0.6 },
  applyButtonText: { color: colors.textInverse, fontWeight: '800', fontSize: 13 },
});
