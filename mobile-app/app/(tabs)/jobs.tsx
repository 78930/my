import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { InputField } from '../../components/ui/InputField';
import { Pill } from '../../components/ui/Pill';
import { industrialAreas } from '../../constants/areas';
import { mostDemandingRoles } from '../../constants/roles';
import { JobCard } from '../../components/jobs/JobCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Notice } from '../../components/ui/Notice';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { Job, WorkerProfile } from '../../types';
import { applyToJob, listJobs } from '../../services/jobs';
import { ApiError } from '../../lib/api';
import { isJobSaved, toggleSavedJob } from '../../services/savedJobs';

type QueryState = { area: string; role: string; search: string; page: number };

export default function JobsTab() {
  const { token, isWorker, profile } = useAuth();
  const workerProfile = isWorker ? (profile as WorkerProfile | null) : null;

  const [queryState, setQueryState] = useState<QueryState>(() => ({
    area: workerProfile?.preferredAreas?.[0] || 'Jeedimetla',
    role: workerProfile?.preferredRoles?.[0] || 'Production Supervisor',
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

  useEffect(() => {
    let cancelled = false;

    if (page === 1) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    async function load() {
      try {
        const { items: newItems, pagination } = await listJobs({ area, role, q: search || undefined, page });
        const entries = await Promise.all(newItems.map(async (job) => [job.id, await isJobSaved(job.id)] as const));
        if (!cancelled) {
          if (page === 1) {
            setItems(newItems);
            setSavedMap(Object.fromEntries(entries));
          } else {
            setItems((prev) => [...prev, ...newItems]);
            setSavedMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
          }
          setHasMore(pagination?.hasMore ?? false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Unable to load jobs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [queryState]);

  const subtitle = useMemo(() => `${items.length} result${items.length === 1 ? '' : 's'}`, [items.length]);

  async function handleApply(jobId: string) {
    if (!token || !isWorker) {
      setNotice('Log in as a worker to apply for jobs.');
      return;
    }
    setNotice('');
    setApplyingId(jobId);
    try {
      await applyToJob(token, jobId);
      setNotice('Application submitted successfully.');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Unable to apply right now');
    } finally {
      setApplyingId('');
    }
  }

  async function handleToggleSave(job: Job) {
    const nextSaved = await toggleSavedJob(job);
    setSavedMap((current) => ({ ...current, [job.id]: nextSaved }));
    setNotice(nextSaved ? 'Job saved for later.' : 'Saved job removed.');
  }

  return (
    <Screen>
      <SectionCard title="Jobs" subtitle={subtitle}>
        <InputField
          icon="search-outline"
          placeholder="Search jobs, skills, company..."
          value={search}
          onChangeText={(val) => setQueryState((q) => ({ ...q, search: val, page: 1 }))}
        />

        <Text style={styles.label}>Industrial area</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {industrialAreas.map((item) => (
            <Pill key={item} label={item} active={area === item} onPress={() => setQueryState((q) => ({ ...q, area: item, page: 1 }))} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Popular roles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {mostDemandingRoles.map((item) => (
            <Pill key={item} label={item} active={role === item} onPress={() => setQueryState((q) => ({ ...q, role: item, page: 1 }))} />
          ))}
        </ScrollView>

        <Notice
          message={notice}
          variant={notice.includes('successfully') || notice.includes('saved') ? 'success' : notice.includes('already') ? 'warning' : 'error'}
        />
      </SectionCard>

      {loading ? <EmptyState icon="hourglass-outline" title="Loading jobs" message="Fetching live openings…" /> : null}
      {!loading && error ? <EmptyState icon="cloud-offline-outline" title="Unable to load jobs" message={error} /> : null}
      {!loading && !error && !items.length ? (
        <EmptyState icon="briefcase-outline" title="No jobs found" message="Try another area, role or search." />
      ) : null}
      {!loading && !error
        ? items.map((job) => (
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
        : null}

      {!loading && !error && hasMore && !loadingMore ? (
        <Pressable
          style={styles.loadMoreBtn}
          onPress={() => setQueryState((q) => ({ ...q, page: q.page + 1 }))}
        >
          <Text style={styles.loadMoreText}>Load more jobs</Text>
        </Pressable>
      ) : null}
      {loadingMore ? (
        <View style={styles.loadingMoreRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingMoreText}>Loading more…</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontWeight: '700', fontSize: 13 },
  row: { gap: 8 },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  loadMoreText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  loadingMoreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, marginBottom: 8,
  },
  loadingMoreText: { color: colors.textMuted, fontSize: 14 },
});
