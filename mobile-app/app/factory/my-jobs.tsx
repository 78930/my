import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import { listFactoryJobs, updateJobStatus } from '../../services/factory';
import { ApiError } from '../../lib/api';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

type Filter = 'ALL' | 'OPEN' | 'CLOSED';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'CLOSED', label: 'Closed' },
];

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: active ? BRAND_BLUE : WHITE, borderWidth: 1.5, borderColor: active ? BRAND_BLUE : '#E2E8F0' }}
    >
      <Text style={{ color: active ? WHITE : '#475569', fontSize: 13, fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium' }}>{label}</Text>
    </Pressable>
  );
}

function JobManageCard({
  job, busy, onToggleStatus, onPipeline, onEdit,
}: {
  job: Job; busy: boolean; onToggleStatus: () => void; onPipeline: () => void; onEdit: () => void;
}) {
  const isOpen = (job.status || 'OPEN') === 'OPEN';
  return (
    <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1.5, borderColor: isOpen ? '#BFDBFE' : '#E2E8F0' }}>
      {/* Status row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isOpen ? '#F0FDF4' : '#F1F5F9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isOpen ? '#22C55E' : '#94A3B8' }} />
          <Text style={{ color: isOpen ? '#15803D' : '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{isOpen ? 'Open' : 'Closed'}</Text>
        </View>
        <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>{job.employmentType || 'Full-time'}</Text>
      </View>

      <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>{job.title || job.role}</Text>

      {/* Meta */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {job.area ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="location-outline" size={13} color="#64748B" />
            <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>{job.area}</Text>
          </View>
        ) : null}
        {job.shift ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>{job.shift}</Text>
          </View>
        ) : null}
        {job.pay ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="cash-outline" size={13} color="#64748B" />
            <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>{job.pay}</Text>
          </View>
        ) : null}
      </View>

      {/* Skills */}
      {job.skills.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {job.skills.slice(0, 4).map((s) => (
            <View key={s} style={{ backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>{s}</Text>
            </View>
          ))}
          {job.skills.length > 4 ? (
            <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', alignSelf: 'center' }}>+{job.skills.length - 4} more</Text>
          ) : null}
        </View>
      ) : null}

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onPipeline(); }}
          style={{ flex: 1, height: 40, backgroundColor: '#EBF0FF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Ionicons name="git-network-outline" size={16} color={BRAND_BLUE} />
          <Text style={{ color: BRAND_BLUE, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Pipeline</Text>
        </Pressable>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onEdit(); }}
          style={{ height: 40, paddingHorizontal: 16, backgroundColor: '#F1F5F9', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="create-outline" size={18} color="#475569" />
        </Pressable>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleStatus(); }}
          disabled={busy}
          style={{ flex: 1, height: 40, backgroundColor: isOpen ? '#FEF2F2' : '#F0FDF4', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {busy
            ? <ActivityIndicator size="small" color={isOpen ? '#EF4444' : '#22C55E'} />
            : <Ionicons name={isOpen ? 'close-circle-outline' : 'refresh-outline'} size={16} color={isOpen ? '#EF4444' : '#22C55E'} />
          }
          <Text style={{ color: isOpen ? '#EF4444' : '#22C55E', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{isOpen ? 'Close' : 'Reopen'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

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

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [token, isFactory]);

  async function handleToggleStatus(job: Job) {
    if (!token) return;
    const nextStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    Alert.alert(
      `${nextStatus === 'CLOSED' ? 'Close' : 'Reopen'} job`,
      `Are you sure you want to ${nextStatus === 'CLOSED' ? 'close' : 'reopen'} "${job.title || job.role}"?`,
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
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_BLUE} />}
        >
          {/* ── Blue header ── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); router.back(); }}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="arrow-back-outline" size={20} color={WHITE} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>My Jobs</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{jobs.length} job{jobs.length === 1 ? '' : 's'} posted</Text>
                </View>
              </View>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/factory/post-job' as never); }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="add" size={24} color={WHITE} />
              </Pressable>
            </View>

            {/* Stat boxes */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(96,165,250,0.18)', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#93C5FD', fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{openCount}</Text>
                <Text style={{ color: '#93C5FD', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Open</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{closedCount}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Closed</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(52,211,153,0.18)', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#6EE7B7', fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{jobs.length}</Text>
                <Text style={{ color: '#6EE7B7', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Total</Text>
              </View>
            </View>
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 14 }}>

            {/* Filter chips */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FILTERS.map((f) => (
                <FilterChip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
              ))}
            </View>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading your jobs…</Text>
              </View>
            ) : error ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
                <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Unable to load jobs</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>{error}</Text>
              </View>
            ) : !displayed.length ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                <Ionicons name="briefcase-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {filter === 'ALL' ? 'No jobs posted yet' : `No ${filter.toLowerCase()} jobs`}
                </Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>
                  {filter === 'ALL' ? 'Tap the + button to post your first job opening.' : 'Switch to "All" to see other postings.'}
                </Text>
                {filter === 'ALL' ? (
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/factory/post-job' as never); }}
                    style={{ height: 50, backgroundColor: BRAND_BLUE, borderRadius: 16, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: WHITE, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Post a Job</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              displayed.map((job) => (
                <JobManageCard
                  key={job.id}
                  job={job}
                  busy={busyJobId === job.id}
                  onToggleStatus={() => handleToggleStatus(job)}
                  onPipeline={() => router.push(`/factory/pipeline?jobId=${job.id}` as never)}
                  onEdit={() => router.push(`/factory/edit-job?id=${job.id}` as never)}
                />
              ))
            )}

            <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
