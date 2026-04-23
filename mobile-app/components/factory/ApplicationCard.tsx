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

export function ApplicationCard({ item, busy = false, onShortlist, onHire }: Props) {
  const [pay, setPay] = useState(String(item.worker.salaryMin || 0));
  const [joiningDate, setJoiningDate] = useState('');
  const canShortlist = item.status === 'APPLIED';
  const canHire = item.status === 'APPLIED' || item.status === 'SHORTLISTED';

  const statusTone = useMemo(() => {
    if (item.status === 'HIRED') return styles.statusSuccess;
    if (item.status === 'SHORTLISTED') return styles.statusHighlight;
    return styles.statusNeutral;
  }, [item.status]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.worker.name}</Text>
          <Text style={styles.role}>{item.worker.role}</Text>
        </View>
        <View style={[styles.statusBadge, statusTone]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Area: {item.worker.area}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Shift: {item.worker.shift}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Exp: {item.worker.experience}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Salary: {item.worker.salaryPreference}</Text>
        </View>
      </View>

      {item.note ? (
        <View style={styles.noteBox}>
          <Ionicons name="document-text-outline" size={16} color="#1d4ed8" />
          <Text style={styles.noteText}>{item.note}</Text>
        </View>
      ) : null}

      <View style={styles.skillRow}>
        {item.worker.skills.slice(0, 6).map((skill) => (
          <View key={skill} style={styles.skillChip}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      {canHire ? (
        <View style={styles.formWrap}>
          <InputField icon="cash-outline" placeholder="Proposed pay" value={pay} onChangeText={setPay} />
          <InputField
            icon="calendar-outline"
            placeholder="Joining date (YYYY-MM-DD)"
            value={joiningDate}
            onChangeText={setJoiningDate}
          />
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.secondaryButton, (!canShortlist || busy) && styles.disabledButton]}
          disabled={!canShortlist || busy}
          onPress={() => onShortlist?.(item.id)}
        >
          <Text style={styles.secondaryText}>{busy && canShortlist ? 'Working...' : 'Shortlist'}</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, (!canHire || busy) && styles.disabledButton]}
          disabled={!canHire || busy}
          onPress={() =>
            onHire?.(item.id, {
              proposedPay: Number(pay || 0),
              joiningDate: joiningDate || undefined,
            })
          }
        >
          <Text style={styles.primaryText}>{busy && canHire ? 'Working...' : item.status === 'HIRED' ? 'Hired' : 'Hire'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 16, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  role: { color: colors.textSoft, marginTop: 4 },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  statusNeutral: { backgroundColor: '#e2e8f0' },
  statusHighlight: { backgroundColor: '#fff7ed' },
  statusSuccess: { backgroundColor: '#ecfdf5' },
  statusText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaBox: { width: '48%', backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  metaText: { color: colors.textSoft, fontSize: 12, fontWeight: '600' },
  noteBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noteText: { color: '#1d4ed8', lineHeight: 18, flex: 1, fontSize: 12 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  skillText: { color: '#c2410c', fontWeight: '600', fontSize: 12 },
  formWrap: { gap: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { color: colors.textInverse, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: colors.textInverse, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
});
