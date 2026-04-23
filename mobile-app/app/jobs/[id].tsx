import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';
import { JobDetailCard } from '../../components/jobs/JobDetailCard';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { Job } from '../../types';
import { getJobDetails, applyToJob } from '../../services/jobs';
import { isJobSaved, toggleSavedJob } from '../../services/savedJobs';

export default function JobDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { token, isWorker } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!params.id) {
        setLoading(false);
        setError('Missing job id.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [details, savedState] = await Promise.all([getJobDetails(params.id), isJobSaved(params.id)]);
        if (!cancelled) {
          setJob(details);
          setSaved(savedState);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Unable to load job details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleApply() {
    if (!job) return;
    if (!token || !isWorker) {
      setNotice('Log in as a worker to apply for this role.');
      return;
    }

    setSubmitting(true);
    setNotice('');
    try {
      await applyToJob(token, job.id);
      setNotice('Application submitted successfully.');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Unable to apply right now');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave() {
    if (!job) return;
    const nextSaved = await toggleSavedJob(job);
    setSaved(nextSaved);
    setNotice(nextSaved ? 'Job saved for later.' : 'Removed from saved jobs.');
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>Job details</Text>
        <Pressable style={styles.iconButton} onPress={handleSave}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.textInverse} />
        </Pressable>
      </View>

      {loading ? <EmptyState title="Loading job" message="Fetching full job details from the backend." /> : null}
      {!loading && error ? <EmptyState title="Unable to load job" message={error} /> : null}
      {!loading && !error && job ? <JobDetailCard job={job} /> : null}

      {notice ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {job ? (
        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/worker/saved')}>
            <Text style={styles.secondaryButtonText}>Saved jobs</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleApply} disabled={submitting}>
            <Text style={styles.primaryButtonText}>{submitting ? 'Applying...' : 'Apply now'}</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topTitle: { color: colors.textInverse, fontSize: 20, fontWeight: '800' },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
  },
  noticeBox: { backgroundColor: '#eff6ff', borderRadius: 16, padding: 12 },
  noticeText: { color: '#1d4ed8', lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.text, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.textInverse, fontWeight: '800' },
});
