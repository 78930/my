import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { JobApplication } from '../../types';

function formatDate(value?: string) {
  if (!value) return 'Recent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString();
}

export function ApplicationHistoryCard({
  item,
  onOpenJob,
}: {
  item: JobApplication;
  onOpenJob?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.job?.title || item.job?.role || 'Applied job'}</Text>
          <Text style={styles.company}>{item.job?.company || 'Factory'}</Text>
        </View>
        <View style={[styles.statusBadge, badgeByStatus[item.status] || styles.statusDefault]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaChip}>{item.job?.area || 'Area not set'}</Text>
        <Text style={styles.metaChip}>{item.job?.shift || 'Shift not set'}</Text>
        <Text style={styles.metaChip}>{formatDate(item.updatedAt || item.createdAt)}</Text>
      </View>

      {item.note ? <Text style={styles.note}>Note: {item.note}</Text> : null}

      {onOpenJob && item.jobId ? (
        <Pressable style={styles.button} onPress={onOpenJob}>
          <Text style={styles.buttonText}>Open job</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const badgeByStatus = StyleSheet.create({
  APPLIED: { backgroundColor: '#eff6ff' },
  SHORTLISTED: { backgroundColor: '#ecfccb' },
  INTERVIEW: { backgroundColor: '#fef3c7' },
  HIRED: { backgroundColor: '#dcfce7' },
  REJECTED: { backgroundColor: '#fee2e2' },
});

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 16 },
  top: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  company: { color: colors.textSoft, marginTop: 4 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-start' },
  statusDefault: { backgroundColor: '#f1f5f9' },
  statusText: { color: colors.text, fontSize: 12, fontWeight: '700' },
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
  note: { color: colors.textSoft, marginTop: 12, lineHeight: 20 },
  button: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: colors.panel,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: { color: colors.textInverse, fontWeight: '700', fontSize: 12 },
});
