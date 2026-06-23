import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Notice } from '../../components/ui/Notice';
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
  const [note, setNote] = useState('');
  const [applied, setApplied] = useState(false);

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
      await applyToJob(token, job.id, note.trim() || undefined);
      setApplied(true);
      setNote('');
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

      {loading ? <EmptyState icon="hourglass-outline" title="Loading job" message="Fetching job details…" /> : null}
      {!loading && error ? <EmptyState icon="cloud-offline-outline" title="Unable to load job" message={error} /> : null}
      {!loading && !error && job ? <JobDetailCard job={job} /> : null}

      <Notice
        message={notice}
        variant={notice.includes('successfully') || notice.includes('saved') ? 'success' : notice.includes('already') ? 'warning' : notice ? 'error' : 'info'}
      />

      {job && isWorker && !applied ? (
        <View style={styles.noteWrap}>
          <Text style={styles.noteLabel}>Message to factory (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Tell them why you're a great fit…"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      ) : null}

      {job ? (
        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/worker/saved')}>
            <Text style={styles.secondaryButtonText}>Saved jobs</Text>
          </Pressable>
          {applied ? (
            <View style={[styles.primaryButton, styles.appliedButton]}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Applied!</Text>
            </View>
          ) : (
            <Pressable style={styles.primaryButton} onPress={handleApply} disabled={submitting || !isWorker}>
              <Text style={styles.primaryButtonText}>{submitting ? 'Applying…' : isWorker ? 'Apply now' : 'Worker only'}</Text>
            </Pressable>
          )}
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
  noteWrap: { gap: 6 },
  noteLabel: { color: colors.text, fontWeight: '700', fontSize: 13 },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 80,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.text, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedButton: { backgroundColor: '#16a34a' },
  primaryButtonText: { color: colors.textInverse, fontWeight: '800' },
});
