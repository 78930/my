import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { JobCard } from '../../components/jobs/JobCard';
import { colors } from '../../constants/colors';
import { listSavedJobs, unsaveJob } from '../../services/savedJobs';
import { SavedJob } from '../../types';

export default function SavedJobsScreen() {
  const [items, setItems] = useState<SavedJob[]>([]);

  async function load() {
    const data = await listSavedJobs();
    setItems(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUnsave(jobId: string) {
    await unsaveJob(jobId);
    await load();
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>Saved jobs</Text>
        <View style={styles.iconSpacer} />
      </View>

      <SectionCard title="Saved for later" subtitle={`${items.length} saved job${items.length === 1 ? '' : 's'} on this device`}>
        <Text style={styles.helperText}>Saved jobs are stored locally so workers can revisit openings quickly.</Text>
      </SectionCard>

      {!items.length ? (
        <EmptyState title="No saved jobs" message="Save a job from the Jobs list or Job details screen." />
      ) : (
        items.map((item) => (
          <JobCard
            key={item.jobId}
            job={item.job}
            onView={() => router.push(`/jobs/${item.jobId}` as never)}
            onSave={() => handleUnsave(item.jobId)}
            isSaved
          />
        ))
      )}
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
