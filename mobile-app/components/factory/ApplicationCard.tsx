import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import { JobApplication } from '../../types';
import { InputField } from '../ui/InputField';

type Props = {
  item: JobApplication;
  busy?: boolean;
  onShortlist?: (applicationId: string) => Promise<void> | void;
  onHire?: (applicationId: string, payload: { proposedPay: number; joiningDate?: string }) => Promise<void> | void;
};

const STATUS_CONFIG = {
  APPLIED:     { label: 'Applied',     bg: '#eff6ff', text: '#1d4ed8', icon: 'time-outline'             } as const,
  SHORTLISTED: { label: 'Shortlisted', bg: '#fff7ed', text: '#c2410c', icon: 'star-outline'             } as const,
  HIRED:       { label: 'Hired',       bg: '#f0fdf4', text: '#15803d', icon: 'checkmark-circle-outline' } as const,
  REJECTED:    { label: 'Rejected',    bg: '#fef2f2', text: '#b91c1c', icon: 'close-circle-outline'     } as const,
};

export function ApplicationCard({ item, busy = false, onShortlist, onHire }: Props) {
  const [pay, setPay] = useState(String(item.worker.salaryMin || ''));
  const [joiningDate, setJoiningDate] = useState('');

  const canShortlist = item.status === 'APPLIED';
  const canHire = item.status === 'APPLIED' || item.status === 'SHORTLISTED';
  const isHired = item.status === 'HIRED';

  const statusCfg = useMemo(
    () => STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.APPLIED,
    [item.status]
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.topRow}>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarText}>
            {(item.worker.name || 'W').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.worker.name}</Text>
          <Text style={styles.role} numberOfLines={1}>{item.worker.role || 'Worker'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon} size={12} color={statusCfg.text} />
          <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Meta grid */}
      <View style={styles.metaRow}>
        <View style={styles.metaBox}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{item.worker.area}</Text>
        </View>
        <View style={styles.metaBox}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{item.worker.shift}</Text>
        </View>
        <View style={styles.metaBox}>
          <Ionicons name="briefcase-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{item.worker.experience}</Text>
        </View>
        <View style={styles.metaBox}>
          <Ionicons name="cash-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{item.worker.salaryPreference}</Text>
        </View>
      </View>

      {/* Application note */}
      {item.note ? (
        <View style={styles.noteBox}>
          <Ionicons name="chatbox-ellipses-outline" size={14} color="#1d4ed8" />
          <Text style={styles.noteText}>{item.note}</Text>
        </View>
      ) : null}

      {/* Skills */}
      {item.worker.skills.length > 0 ? (
        <View style={styles.skillRow}>
          {item.worker.skills.slice(0, 5).map((skill) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {item.worker.skills.length > 5 ? (
            <View style={styles.skillChip}>
              <Text style={styles.skillText}>+{item.worker.skills.length - 5}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Hire form */}
      {canHire && !isHired ? (
        <View style={styles.formWrap}>
          <InputField icon="cash-outline" placeholder="Proposed pay (₹)" value={pay} onChangeText={setPay} keyboardType="numeric" />
          <InputField icon="calendar-outline" placeholder="Joining date (YYYY-MM-DD)" value={joiningDate} onChangeText={setJoiningDate} />
        </View>
      ) : null}

      {/* Actions */}
      {!isHired ? (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.shortlistBtn, (!canShortlist || busy) && styles.disabledBtn]}
            disabled={!canShortlist || busy}
            onPress={() => onShortlist?.(item.id)}
          >
            <Ionicons name="star-outline" size={14} color={colors.textInverse} />
            <Text style={styles.shortlistText}>{busy && canShortlist ? '...' : 'Shortlist'}</Text>
          </Pressable>
          <Pressable
            style={[styles.hireBtn, (!canHire || busy) && styles.disabledBtn]}
            disabled={!canHire || busy}
            onPress={() => onHire?.(item.id, { proposedPay: Number(pay || 0), joiningDate: joiningDate || undefined })}
          >
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.textInverse} />
            <Text style={styles.hireText}>{busy && canHire ? '...' : 'Hire'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.hiredBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#15803d" />
          <Text style={styles.hiredBannerText}>Offer sent — awaiting worker confirmation</Text>
        </View>
      )}
    </View>
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
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textInverse, fontWeight: '800', fontSize: 16 },
  name: { color: colors.text, fontSize: 15, fontWeight: '800' },
  role: { color: colors.textSoft, marginTop: 2, fontSize: 12 },
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
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaText: { color: colors.textSoft, fontSize: 12, fontWeight: '600', flex: 1 },
  noteBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noteText: { color: '#1d4ed8', lineHeight: 18, flex: 1, fontSize: 12 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skillText: { color: '#c2410c', fontWeight: '700', fontSize: 11 },
  formWrap: { gap: 8 },
  actionRow: { flexDirection: 'row', gap: 10 },
  shortlistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingVertical: 13,
  },
  shortlistText: { color: colors.textInverse, fontWeight: '800', fontSize: 13 },
  hireBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
  },
  hireText: { color: colors.textInverse, fontWeight: '800', fontSize: 13 },
  disabledBtn: { opacity: 0.45 },
  hiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hiredBannerText: { color: '#15803d', fontWeight: '700', fontSize: 13, flex: 1 },
});
