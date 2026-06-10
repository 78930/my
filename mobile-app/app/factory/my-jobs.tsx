import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import { listFactoryJobs, updateJobStatus } from '../../services/factory';
import { ApiError } from '../../lib/api';

type Filter = 'ALL' | 'OPEN' | 'CLOSED';

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All jobs' },
  { key: 'OPEN', label: 'Open' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function MyJobsScreen() {
  const { token, isFactory } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyJobId, setBusyJobId] = useState('');

  async function load(silent = false) {
    if (!token || !isFactory) { setLoading(false); return; }
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await listFactoryJobs(token);
      setJobs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load your jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [token, isFactory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [token, isFactory]);

  async function handleToggleStatus(job: Job) {
    if (!token) return;
    const nextStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const label = nextStatus === 'CLOSED' ? 'close' : 'reopen';

    Alert.alert(
      `${nextStatus === 'CLOSED' ? 'Close' : 'Reopen'} job`,
      `Are you sure you want to ${label} "${job.title || job.role}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus === 'CLOSED' ? 'Close job' : 'Reopen',
          style: nextStatus === 'CLOSED' ? 'destructive' : 'default',
          onPress: async () => {
            setBusyJobId(job.id);
            try {
              await updateJobStatus(token, job.id, nextStatus);
              setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: nextStatus } : j));
            } catch (err) {
              Alert.alert('Error', err instanceof ApiError ? err.message : 'Unable to update job status');
            } finally {
              setBusyJobId('');
            }
          },
        },
      ]
    );
  }

  const displayed = filter === 'ALL' ? jobs : jobs.filter((j) => (j.status || 'OPEN') === filter);
  const openCount = jobs.filter((j) => (j.status || 'OPEN') === 'OPEN').length;
  const closedCount = jobs.filter((j) => j.status === 'CLOSED').length;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>My jobs</Text>
        <Pressable style={styles.postBtn} onPress={() => router.push('/factory/post-job')}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Summary chips */}
      <View style={styles.chipRow}>
        <View style={[styles.chip, { backgroundColor: '#eff6ff' }]}>
          <Text style={[styles.chipNum, { color: '#3b82f6' }]}>{openCount}</Text>
          <Text style={styles.chipLabel}>Open</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: '#f1f5f9' }]}>
          <Text style={[styles.chipNum, { color: '#64748b' }]}>{closedCount}</Text>
          <Text style={styles.chipLabel}>Closed</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: '#f0fdf4' }]}>
          <Text style={[styles.chipNum, { color: '#16a34a' }]}>{jobs.length}</Text>
          <Text style={styles.chipLabel}>Total posted</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.filterTab, filter === opt.key && styles.filterTabActive]}
            onPress={() => setFilter(opt.key)}
          >
            <Text style={[styles.filterTabText, filter === opt.key && styles.filterTabTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? <EmptyState icon="hourglass-outline" title="Loading jobs" message="Fetching your posted jobs…" /> : null}
      {!loading && error ? <EmptyState icon="cloud-offline-outline" title="Unable to load jobs" message={error} /> : null}
      {!loading && !error && !displayed.length ? (
        <EmptyState
          icon="briefcase-outline"
          title={filter === 'ALL' ? 'No jobs posted yet' : `No ${filter.toLowerCase()} jobs`}
          message={filter === 'ALL' ? 'Tap the + button to post your first job opening.' : `Switch to "All jobs" to see other postings.`}
        />
      ) : null}

      {!loading && !error
        ? displayed.map((job) => (
            <JobManageCard
              key={job.id}
              job={job}
              busy={busyJobId === job.id}
              onToggleStatus={() => handleToggleStatus(job)}
              onPipeline={() => router.push('/factory/pipeline')}
              onEdit={() => router.push(`/factory/edit-job?id=${job.id}` as never)}
            />
          ))
        : null}
    </Screen>
  );
}

function JobManageCard({
  job,
  busy,
  onToggleStatus,
  onPipeline,
  onEdit,
}: {
  job: Job;
  busy: boolean;
  onToggleStatus: () => void;
  onPipeline: () => void;
  onEdit: () => void;
}) {
  const isOpen = (job.status || 'OPEN') === 'OPEN';

  return (
    <View style={card.wrap}>
      {/* Status badge */}
      <View style={card.topRow}>
        <View style={[card.badge, isOpen ? card.badgeOpen : card.badgeClosed]}>
          <View style={[card.dot, { backgroundColor: isOpen ? '#16a34a' : '#94a3b8' }]} />
          <Text style={[card.badgeText, { color: isOpen ? '#16a34a' : '#64748b' }]}>
            {isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
        <Text style={card.type}>{job.employmentType || 'Full-time'}</Text>
      </View>

      {/* Role / title */}
      <Text style={card.title}>{job.title || job.role}</Text>

      {/* Meta row */}
      <View style={card.metaRow}>
        <MetaTag icon="location-outline" text={job.area} />
        <MetaTag icon="time-outline" text={job.shift} />
        <MetaTag icon="cash-outline" text={job.pay} />
      </View>

      {/* Skills */}
      {job.skills.length > 0 ? (
        <View style={card.skillsRow}>
          {job.skills.slice(0, 4).map((s) => (
            <View key={s} style={card.skillChip}>
              <Text style={card.skillText}>{s}</Text>
            </View>
          ))}
          {job.skills.length > 4 ? (
            <Text style={card.moreSkills}>+{job.skills.length - 4} more</Text>
          ) : null}
        </View>
      ) : null}

      {/* Actions */}
      <View style={card.actions}>
        <Pressable style={card.pipelineBtn} onPress={onPipeline}>
          <Ionicons name="git-network-outline" size={16} color={colors.primary} />
          <Text style={card.pipelineBtnText}>Pipeline</Text>
        </Pressable>
        <Pressable style={card.editBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color="#7c3aed" />
          <Text style={card.editBtnText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[card.toggleBtn, isOpen ? card.closeBtn : card.reopenBtn]}
          onPress={onToggleStatus}
          disabled={busy}
        >
          <Ionicons
            name={busy ? 'hourglass-outline' : isOpen ? 'close-circle-outline' : 'refresh-outline'}
            size={16}
            color={isOpen ? '#b91c1c' : '#16a34a'}
          />
          <Text style={[card.toggleBtnText, { color: isOpen ? '#b91c1c' : '#16a34a' }]}>
            {busy ? '…' : isOpen ? 'Close' : 'Reopen'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MetaTag({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  if (!text) return null;
  return (
    <View style={meta.wrap}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={meta.text}>{text}</Text>
    </View>
  );
}

const meta = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  text: { color: colors.textSoft, fontSize: 12 },
});

const card = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 10,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeOpen: { backgroundColor: '#f0fdf4' },
  badgeClosed: { backgroundColor: '#f1f5f9' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontWeight: '700', fontSize: 12 },
  type: { color: colors.textMuted, fontSize: 12 },
  title: { color: colors.text, fontWeight: '800', fontSize: 17, lineHeight: 22 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  skillText: { color: colors.textSoft, fontSize: 12, fontWeight: '600' },
  moreSkills: { color: colors.textMuted, fontSize: 12, alignSelf: 'center' },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  pipelineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingVertical: 10,
  },
  pipelineBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 10,
  },
  closeBtn: { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3' },
  reopenBtn: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  toggleBtnText: { fontWeight: '700', fontSize: 14 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#f5f3ff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  editBtnText: { color: '#7c3aed', fontWeight: '700', fontSize: 14 },
});

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topTitle: { color: colors.textInverse, fontSize: 20, fontWeight: '800' },
  iconButton: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.panel,
  },
  postBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 2 },
  chipNum: { fontSize: 22, fontWeight: '800' },
  chipLabel: { color: colors.textSoft, fontSize: 11, fontWeight: '600' },
  filterRow: { flexDirection: 'row', backgroundColor: colors.panel, borderRadius: 16, padding: 4, gap: 2 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  filterTabTextActive: { color: '#fff' },
});
