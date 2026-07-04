import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { industrialAreas } from '../../constants/areas';
import { mostDemandingRoles } from '../../constants/roles';
import { JobCard } from '../../components/jobs/JobCard';
import { useAuth } from '../../context/AuthContext';
import { Job, WorkerProfile } from '../../types';
import { applyToJob, listJobs } from '../../services/jobs';
import { ApiError } from '../../lib/api';
import { isJobSaved, toggleSavedJob } from '../../services/savedJobs';

const BRAND_BLUE = '#1240C7';
const WHITE = '#FFFFFF';

type QueryState = { area: string; role: string; search: string; page: number };

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: active ? BRAND_BLUE : WHITE, borderWidth: 1.5, borderColor: active ? BRAND_BLUE : '#E2E8F0' }}
    >
      <Text style={{ color: active ? WHITE : '#475569', fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export default function JobsTab() {
  const { token, isWorker, profile } = useAuth();
  const workerProfile = isWorker ? (profile as WorkerProfile | null) : null;

  const [queryState, setQueryState] = useState<QueryState>(() => ({
    area: workerProfile?.preferredAreas?.[0] || '',
    role: '',
    search: '',
    page: 1,
  }));
  const { area, role, search, page } = queryState;

  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState('');
  const [notice, setNotice] = useState('');
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (page === 1) { setLoading(true); setError(''); } else { setLoadingMore(true); }
    async function load() {
      try {
        const { items: newItems, pagination } = await listJobs({ area, role, q: search || undefined, page });
        const entries = await Promise.all(newItems.map(async (job) => [job.id, await isJobSaved(job.id)] as const));
        if (!cancelled) {
          if (page === 1) { setItems(newItems); setSavedMap(Object.fromEntries(entries)); }
          else { setItems((prev) => [...prev, ...newItems]); setSavedMap((prev) => ({ ...prev, ...Object.fromEntries(entries) })); }
          setHasMore(pagination?.hasMore ?? false);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load jobs');
      } finally {
        if (!cancelled) { setLoading(false); setLoadingMore(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [queryState]);

  async function handleApply(jobId: string) {
    if (!token || !isWorker) { setNotice('Log in as a job seeker to apply for jobs.'); return; }
    setNotice(''); setApplyingId(jobId);
    try { await applyToJob(token, jobId); setNotice('Application submitted successfully.'); }
    catch (err) { setNotice(err instanceof ApiError ? err.message : 'Unable to apply right now'); }
    finally { setApplyingId(''); }
  }

  async function handleToggleSave(job: Job) {
    const nextSaved = await toggleSavedJob(job);
    setSavedMap((c) => ({ ...c, [job.id]: nextSaved }));
    setNotice(nextSaved ? 'Job saved for later.' : 'Saved job removed.');
  }

  const noticeColor = notice.includes('successfully') || notice.includes('saved') ? '#22C55E' : notice.includes('already') ? BRAND_BLUE : '#EF4444';
  const subtitle = useMemo(() => loading ? 'Loading…' : `${items.length} result${items.length === 1 ? '' : 's'}`, [items.length, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Browse Jobs</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{subtitle}</Text>
              </View>
              <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/notifications' as never); }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications-outline" size={20} color={WHITE} />
              </Pressable>
            </View>
            {/* Search bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: searchFocused ? WHITE : 'rgba(255,255,255,0.92)', borderRadius: 14, paddingHorizontal: 14, height: 48, gap: 10, borderWidth: 2, borderColor: searchFocused ? WHITE : 'transparent' }}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" />
              <TextInput
                value={search}
                onChangeText={(v) => setQueryState((q) => ({ ...q, search: v, page: 1 }))}
                placeholder="Search jobs, skills, company…"
                placeholderTextColor="#94A3B8"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{ flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#1E293B', paddingVertical: 0 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setQueryState((q) => ({ ...q, search: '', page: 1 }))}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>
          </View>

          {/* ── Filters + results ────────────────────────────────── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, paddingTop: 20, gap: 14 }}>

            {/* Area chips */}
            <View style={{ gap: 10, paddingHorizontal: 20 }}>
              <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3, textTransform: 'uppercase' }}>Industrial Area</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <FilterChip key="all-area" label="All" active={area === ''} onPress={() => setQueryState((q) => ({ ...q, area: '', page: 1 }))} />
                {industrialAreas.map((item) => (
                  <FilterChip key={item} label={item} active={area === item} onPress={() => setQueryState((q) => ({ ...q, area: item, page: 1 }))} />
                ))}
              </ScrollView>
            </View>

            {/* Role chips */}
            <View style={{ gap: 10, paddingHorizontal: 20 }}>
              <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3, textTransform: 'uppercase' }}>Popular Roles</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <FilterChip key="all-role" label="All" active={role === ''} onPress={() => setQueryState((q) => ({ ...q, role: '', page: 1 }))} />
                {mostDemandingRoles.map((item) => (
                  <FilterChip key={item} label={item} active={role === item} onPress={() => setQueryState((q) => ({ ...q, role: item, page: 1 }))} />
                ))}
              </ScrollView>
            </View>

            {/* Notice */}
            {notice ? (
              <View style={{ marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WHITE, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Ionicons name="information-circle-outline" size={16} color={noticeColor} />
                <Text style={{ flex: 1, color: noticeColor, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{notice}</Text>
              </View>
            ) : null}

            {/* Results */}
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                  <ActivityIndicator size="large" color={BRAND_BLUE} />
                  <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading jobs…</Text>
                </View>
              ) : error ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
                  <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                  <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Unable to load jobs</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular' }}>{error}</Text>
                </View>
              ) : !items.length ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
                  <Ionicons name="briefcase-outline" size={44} color="#94A3B8" />
                  <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>No jobs found</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>Try another area, role or search term.</Text>
                </View>
              ) : (
                items.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onView={() => router.push(`/jobs/${job.id}` as never)}
                    onSave={() => handleToggleSave(job)}
                    isSaved={Boolean(savedMap[job.id])}
                    onApply={isWorker ? () => handleApply(job.id) : undefined}
                    isApplying={applyingId === job.id}
                  />
                ))
              )}

              {!loading && !error && hasMore && !loadingMore ? (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setQueryState((q) => ({ ...q, page: q.page + 1 })); }}
                  style={{ height: 48, backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5, borderColor: BRAND_BLUE, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: BRAND_BLUE, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>Load more jobs</Text>
                </Pressable>
              ) : null}

              {loadingMore ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={BRAND_BLUE} />
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading more…</Text>
                </View>
              ) : null}
            </View>

            <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
