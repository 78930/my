import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../components/ui/Screen';
import { SectionCard } from '../../../components/ui/SectionCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Notice } from '../../../components/ui/Notice';
import { InputField } from '../../../components/ui/InputField';
import { colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { ApiError } from '../../../lib/api';
import { JobApplication } from '../../../types';
import {
  listJobApplications,
  shortlistApplication,
  hireApplication,
  rejectApplication,
} from '../../../services/applications';

const STATUS_CONFIG = {
  APPLIED:     { label: 'Applied',     bg: '#eff6ff', text: '#1d4ed8' },
  SHORTLISTED: { label: 'Shortlisted', bg: '#fff7ed', text: '#c2410c' },
  HIRED:       { label: 'Hired',       bg: '#f0fdf4', text: '#15803d' },
  REJECTED:    { label: 'Rejected',    bg: '#fef2f2', text: '#b91c1c' },
} as const;

export default function ApplicationDetailScreen() {
  const { id, jobId } = useLocalSearchParams<{ id: string; jobId: string }>();
  const { token, isFactory } = useAuth();

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeVariant, setNoticeVariant] = useState<'success' | 'error'>('success');
  const [busy, setBusy] = useState(false);
  const [proposedPay, setProposedPay] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token || !isFactory || !id || !jobId) {
        setLoading(false);
        setError('Missing application or job information.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const items = await listJobApplications(token, jobId);
        const found = items.find((a) => a.id === id);
        if (!cancelled) {
          if (found) {
            setApplication(found);
            setProposedPay(String(found.worker.salaryMin || ''));
          } else {
            setError('Application not found.');
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load application');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, isFactory, id, jobId]);

  async function handleShortlist() {
    if (!token || !application) return;
    setBusy(true);
    setNotice('');
    try {
      const updated = await shortlistApplication(token, application.id);
      setApplication(updated);
      setNotice('Candidate shortlisted successfully.');
      setNoticeVariant('success');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Unable to shortlist candidate');
      setNoticeVariant('error');
    } finally {
      setBusy(false);
    }
  }

  async function handleHire() {
    if (!token || !application) return;
    setBusy(true);
    setNotice('');
    try {
      await hireApplication(token, application.id, {
        proposedPay: Number(proposedPay || 0),
        joiningDate: joiningDate.trim() || undefined,
      });
      const items = await listJobApplications(token, jobId);
      const updated = items.find((a) => a.id === application.id);
      if (updated) setApplication(updated);
      setNotice('Hire offer sent to the candidate.');
      setNoticeVariant('success');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Unable to complete hire');
      setNoticeVariant('error');
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!token || !application) return;
    setBusy(true);
    setNotice('');
    try {
      const updated = await rejectApplication(token, application.id);
      setApplication(updated);
      setNotice('Application rejected.');
      setNoticeVariant('success');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Unable to reject application');
      setNoticeVariant('error');
    } finally {
      setBusy(false);
    }
  }

  const status = application?.status ?? 'APPLIED';
  const statusCfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.APPLIED;
  const canShortlist = status === 'APPLIED';
  const canHire = status === 'APPLIED' || status === 'SHORTLISTED';
  const canReject = status !== 'HIRED' && status !== 'REJECTED';

  return (
    <Screen>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>Application</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <EmptyState icon="hourglass-outline" title="Loading" message="Fetching application details…" />
      ) : error ? (
        <EmptyState icon="cloud-offline-outline" title="Unable to load" message={error} />
      ) : application ? (
        <>
          {/* Worker profile card */}
          <SectionCard title="Candidate">
            <View style={styles.workerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(application.worker.name || 'W').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{application.worker.name}</Text>
                {application.worker.headline ? (
                  <Text style={styles.workerHeadline}>{application.worker.headline}</Text>
                ) : null}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
              </View>
            </View>

            {/* Profile metrics */}
            <View style={styles.metaGrid}>
              <MetaBox icon="briefcase-outline" label="Experience" value={application.worker.experience} />
              <MetaBox icon="cash-outline" label="Salary min" value={application.worker.salaryPreference} />
              <MetaBox icon="time-outline" label="Availability" value={application.worker.availability || 'Available'} />
              <MetaBox icon="swap-horizontal-outline" label="Shift" value={application.worker.shift} />
            </View>

            {/* Preferred areas */}
            {(application.worker.preferredAreas ?? []).length > 0 ? (
              <View style={styles.tagSection}>
                <Text style={styles.tagLabel}>Preferred areas</Text>
                <View style={styles.tagRow}>
                  {(application.worker.preferredAreas ?? []).map((area) => (
                    <View key={area} style={styles.tag}>
                      <Text style={styles.tagText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Preferred roles */}
            {(application.worker.preferredRoles ?? []).length > 0 ? (
              <View style={styles.tagSection}>
                <Text style={styles.tagLabel}>Preferred roles</Text>
                <View style={styles.tagRow}>
                  {(application.worker.preferredRoles ?? []).map((role) => (
                    <View key={role} style={[styles.tag, styles.tagRole]}>
                      <Text style={[styles.tagText, styles.tagRoleText]}>{role}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Skills */}
            {application.worker.skills.length > 0 ? (
              <View style={styles.tagSection}>
                <Text style={styles.tagLabel}>Skills</Text>
                <View style={styles.tagRow}>
                  {application.worker.skills.map((skill) => (
                    <View key={skill} style={[styles.tag, styles.tagSkill]}>
                      <Text style={[styles.tagText, styles.tagSkillText]}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Certifications */}
            {application.worker.certifications.length > 0 ? (
              <View style={styles.tagSection}>
                <Text style={styles.tagLabel}>Certifications</Text>
                <View style={styles.tagRow}>
                  {application.worker.certifications.map((cert) => (
                    <View key={cert} style={styles.tag}>
                      <Text style={styles.tagText}>{cert}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Worker phone — visible to factory */}
            {application.workerPhone ? (
              <Pressable
                style={styles.phoneBtn}
                onPress={() => Linking.openURL(`tel:${application.workerPhone}`)}
              >
                <Ionicons name="call-outline" size={16} color="#15803d" />
                <Text style={styles.phoneBtnText}>{application.workerPhone}</Text>
                <Text style={styles.phoneBtnHint}>Tap to call</Text>
              </Pressable>
            ) : null}

            {/* View full profile button */}
            {application.worker.id ? (
              <Pressable
                style={styles.profileBtn}
                onPress={() => router.push(`/worker/${application.worker.id}` as never)}
              >
                <Ionicons name="person-outline" size={14} color={colors.primary} />
                <Text style={styles.profileBtnText}>View full worker profile</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </Pressable>
            ) : null}
          </SectionCard>

          {/* Application note */}
          {application.note ? (
            <SectionCard title="Candidate note">
              <View style={styles.noteBox}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color="#1d4ed8" />
                <Text style={styles.noteText}>{application.note}</Text>
              </View>
            </SectionCard>
          ) : null}

          {/* Actions */}
          <SectionCard title="Actions">
            <Notice message={notice} variant={noticeVariant} />

            {canHire ? (
              <View style={styles.hireForm}>
                <InputField
                  icon="cash-outline"
                  placeholder="Proposed pay (₹)"
                  value={proposedPay}
                  onChangeText={setProposedPay}
                  keyboardType="numeric"
                />
                <InputField
                  icon="calendar-outline"
                  placeholder="Joining date (YYYY-MM-DD)"
                  value={joiningDate}
                  onChangeText={setJoiningDate}
                />
              </View>
            ) : null}

            <View style={styles.actionRow}>
              {canShortlist ? (
                <Pressable
                  style={[styles.shortlistBtn, busy && styles.disabledBtn]}
                  onPress={handleShortlist}
                  disabled={busy}
                >
                  <Ionicons name="star-outline" size={15} color={colors.textInverse} />
                  <Text style={styles.shortlistText}>{busy ? '…' : 'Shortlist'}</Text>
                </Pressable>
              ) : null}

              {canHire ? (
                <Pressable
                  style={[styles.hireBtn, busy && styles.disabledBtn]}
                  onPress={handleHire}
                  disabled={busy}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color={colors.textInverse} />
                  <Text style={styles.hireBtnText}>{busy ? '…' : 'Hire'}</Text>
                </Pressable>
              ) : null}

              {canReject ? (
                <Pressable
                  style={[styles.rejectBtn, busy && styles.disabledBtn]}
                  onPress={handleReject}
                  disabled={busy}
                >
                  <Ionicons name="close-circle-outline" size={15} color="#b91c1c" />
                  <Text style={styles.rejectBtnText}>{busy ? '…' : 'Reject'}</Text>
                </Pressable>
              ) : null}
            </View>

            {status === 'HIRED' ? (
              <View style={styles.hiredBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                <Text style={styles.hiredBannerText}>Hire offer sent — awaiting worker confirmation</Text>
              </View>
            ) : null}

            {status === 'REJECTED' ? (
              <View style={styles.rejectedBanner}>
                <Ionicons name="close-circle" size={16} color="#b91c1c" />
                <Text style={styles.rejectedBannerText}>This application has been rejected</Text>
              </View>
            ) : null}
          </SectionCard>
        </>
      ) : null}
    </Screen>
  );
}

function MetaBox({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.metaBox}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <View>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: colors.textInverse, fontSize: 20, fontWeight: '800' },
  iconBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  workerHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.textInverse, fontWeight: '800', fontSize: 20 },
  workerName: { color: colors.text, fontWeight: '800', fontSize: 17 },
  workerHeadline: { color: colors.textSoft, fontSize: 13, marginTop: 3 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '800' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    width: '47%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 10,
  },
  metaLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  metaValue: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 1 },
  tagSection: { gap: 6 },
  tagLabel: { color: colors.text, fontWeight: '700', fontSize: 13 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#f1f5f9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  tagRole: { backgroundColor: '#fff7ed' },
  tagRoleText: { color: '#c2410c' },
  tagSkill: { backgroundColor: colors.primarySoft },
  tagSkillText: { color: '#c2410c' },
  phoneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  phoneBtnText: { color: '#15803d', fontWeight: '800', fontSize: 16, flex: 1 },
  phoneBtnHint: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
  profileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.primary,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  profileBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#eff6ff', borderRadius: 12, padding: 12 },
  noteText: { color: '#1d4ed8', lineHeight: 20, flex: 1, fontSize: 13 },
  hireForm: { gap: 8 },
  actionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  shortlistBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.panel, borderRadius: 14, paddingVertical: 14,
  },
  shortlistText: { color: colors.textInverse, fontWeight: '800', fontSize: 14 },
  hireBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14,
  },
  hireBtnText: { color: colors.textInverse, fontWeight: '800', fontSize: 14 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#fef2f2', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#fecaca',
  },
  rejectBtnText: { color: '#b91c1c', fontWeight: '800', fontSize: 14 },
  disabledBtn: { opacity: 0.45 },
  hiredBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12,
  },
  hiredBannerText: { color: '#15803d', fontWeight: '700', fontSize: 13, flex: 1 },
  rejectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 12,
  },
  rejectedBannerText: { color: '#b91c1c', fontWeight: '700', fontSize: 13, flex: 1 },
});
