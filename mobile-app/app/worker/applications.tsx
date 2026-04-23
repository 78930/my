import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ApplicationHistoryCard } from '../../components/worker/ApplicationHistoryCard';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { listMyApplications } from '../../services/applications';
import { ApiError } from '../../lib/api';
import { JobApplication } from '../../types';

export default function WorkerApplicationsScreen() {
  const { token, isWorker } = useAuth();
  const [items, setItems] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token || !isWorker) {
        setLoading(false);
        setError('Log in as a worker to view application history.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await listMyApplications(token);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load applications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, isWorker]);

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>Application history</Text>
        <View style={styles.iconSpacer} />
      </View>

      <SectionCard title="Your applications" subtitle={`Track applied, shortlisted, and hired updates • ${items.length} item${items.length === 1 ? '' : 's'}`}>
        <Text style={styles.helperText}>This screen is connected to the worker application history API.</Text>
      </SectionCard>

      {loading ? <EmptyState title="Loading applications" message="Fetching your application history from the backend." /> : null}
      {!loading && error ? <EmptyState title="Unable to load history" message={error} /> : null}
      {!loading && !error && !items.length ? (
        <EmptyState title="No applications yet" message="Browse jobs and apply to see your history here." />
      ) : null}
      {!loading && !error
        ? items.map((item) => (
            <ApplicationHistoryCard
              key={item.id}
              item={item}
              onOpenJob={item.jobId ? () => router.push(`/jobs/${item.jobId}` as never) : undefined}
            />
          ))
        : null}
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
  iconSpacer: { width: 42, height: 42 },
  helperText: { color: colors.textSoft, lineHeight: 20 },
});
