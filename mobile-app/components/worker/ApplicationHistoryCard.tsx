import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import { JobApplication } from '../../types';

function formatDate(value?: string) {
  if (!value) return 'Recent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

type StatusKey = 'APPLIED' | 'SHORTLISTED' | 'HIRED' | 'REJECTED';

const STATUS_CONFIG: Record<StatusKey, { label: string; bg: string; text: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  APPLIED:     { label: 'Applied',     bg: '#eff6ff', text: '#1d4ed8', icon: 'time-outline'             },
  SHORTLISTED: { label: 'Shortlisted', bg: '#fff7ed', text: '#c2410c', icon: 'star-outline'             },
  HIRED:       { label: 'Hired',       bg: '#f0fdf4', text: '#15803d', icon: 'checkmark-circle-outline' },
  REJECTED:    { label: 'Rejected',    bg: '#fef2f2', text: '#b91c1c', icon: 'close-circle-outline'     },
};

export function ApplicationHistoryCard({
  item,
  onOpenJob,
}: {
  item: JobApplication;
  onOpenJob?: () => void;
}) {
  const status = item.status as StatusKey;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.APPLIED;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {item.job?.title || item.job?.role || 'Applied job'}
          </Text>
          <Text style={styles.company} numberOfLines={1}>
            {item.job?.company || 'Factory'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={12} color={cfg.text} />
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Meta chips */}
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="location-outline" size={11} color="#64748b" />
          <Text style={styles.metaText}>{item.job?.area || 'Area TBD'}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="time-outline" size={11} color="#64748b" />
          <Text style={styles.metaText}>{item.job?.shift || 'Shift TBD'}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={11} color="#64748b" />
          <Text style={styles.metaText}>{formatDate(item.updatedAt || item.createdAt)}</Text>
        </View>
      </View>

      {/* Application note */}
      {item.note ? (
        <View style={styles.noteBox}>
          <Ionicons name="chatbox-ellipses-outline" size={14} color="#1d4ed8" />
          <Text style={styles.noteText}>{item.note}</Text>
        </View>
      ) : null}

      {/* Action */}
      {onOpenJob && item.jobId ? (
        <Pressable style={styles.button} onPress={onOpenJob}>
          <Ionicons name="open-outline" size={14} color={colors.textInverse} />
          <Text style={styles.buttonText}>View job</Text>
        </Pressable>
      ) : null}
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
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { color: colors.text, fontWeight: '800', fontSize: 15, lineHeight: 22 },
  company: { color: colors.textSoft, marginTop: 2, fontSize: 13 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '800' },
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
  metaText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteText: { color: '#1d4ed8', lineHeight: 18, flex: 1, fontSize: 12 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.panel,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
});
