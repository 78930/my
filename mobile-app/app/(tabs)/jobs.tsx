import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { InputField } from '../../components/ui/InputField';
import { Pill } from '../../components/ui/Pill';
import { industrialAreas } from '../../constants/areas';
import { mostDemandingRoles } from '../../constants/roles';
import { JobCard } from '../../components/jobs/JobCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import { applyToJob, listJobs } from '../../services/jobs';
import { ApiError } from '../../lib/api';
import { isJobSaved, toggleSavedJob } from '../../services/savedJobs';

export default function JobsTab() {
  const { token, isWorker } = useAuth();
  const [area, setArea] = useState('Jeedimetla');
  const [role, setRole] = useState('Production Supervisor');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState('');
  const [notice, setNotice] = useState('');
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await listJobs({ area, role, q: search || undefined });
        const entries = await Promise.all(data.map(async (job) => [job.id, await isJobSaved(job.id)] as const));
        if (!cancelled) {
          setItems(data);
          setSavedMap(Object.fromEntries(entries));
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof ApiError ? err.message : 'Unable to load jobs';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [area, role, search]);

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
      const message = err instanceof ApiError ? err.message : 'Unable to apply right now';
      setNotice(message);
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
          onChangeText={setSearch}
        />

        <Text style={styles.label}>Industrial area</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.column}>
  {industrialAreas.map((item) => (
    <Pill key={item} label={item} active={area === item} onPress={() => setArea(item)} />
  ))}
</ScrollView>

        <Text style={styles.label}>Popular roles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {mostDemandingRoles.map((item) => (
            <Pill key={item} label={item} active={role === item} onPress={() => setRole(item)} />
          ))}
        </ScrollView>

        {notice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
      </SectionCard>

      {loading ? <EmptyState title="Loading jobs" message="Fetching live openings from the Sketu backend." /> : null}
      {!loading && error ? <EmptyState title="Unable to load jobs" message={error} /> : null}
      {!loading && !error && !items.length ? (
        <EmptyState title="No jobs found" message="Try another area, role or search." />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontWeight: '700' },
  row: { gap: 8 },
  noticeBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 12,
  },
  noticeText: { color: '#1d4ed8', lineHeight: 20 },
});
