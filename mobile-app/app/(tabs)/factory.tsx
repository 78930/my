import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { FactoryDashboardSummary, Job } from '../../types';
import { getFactoryDashboard, listFactoryJobs } from '../../services/factory';
import { createJob } from '../../services/jobs';
import { InputField } from '../../components/ui/InputField';
import { ApiError } from '../../lib/api';

const initialSummary: FactoryDashboardSummary = {
  openJobs: 0,
  totalApplications: 0,
  shortlisted: 0,
  hires: 0,
};

export default function FactoryTab() {
  const { user, token, isFactory } = useAuth();
  const [summary, setSummary] = useState<FactoryDashboardSummary>(initialSummary);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [shift, setShift] = useState('');
  const [skills, setSkills] = useState('');
  const [description, setDescription] = useState('');
  const [payMin, setPayMin] = useState('');
  const [payMax, setPayMax] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token || !isFactory) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [summaryData, jobData] = await Promise.all([
          getFactoryDashboard(token),
          listFactoryJobs(token, { status: 'OPEN' }),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setJobs(jobData);
        }
      } catch (err) {
        if (!cancelled) {
          const nextMessage = err instanceof ApiError ? err.message : 'Unable to load dashboard summary';
          setMessage(nextMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, isFactory]);

  async function handleCreateJob() {
    if (!token || !isFactory) {
      setMessage('Log in as a factory account to post jobs.');
      return;
    }

    setCreating(true);
    setMessage('');
    try {
      await createJob(token, {
        title,
        description,
        area,
        shift,
        skillsRequired: skills.split(',').map((value) => value.trim()).filter(Boolean),
        payMin: Number(payMin || 0),
        payMax: Number(payMax || 0),
        employmentType: 'Full-time',
      });

      const [nextSummary, nextJobs] = await Promise.all([
        getFactoryDashboard(token),
        listFactoryJobs(token, { status: 'OPEN' }),
      ]);
      setSummary(nextSummary);
      setJobs(nextJobs);
      setMessage('Job posted successfully.');
    } catch (err) {
      const nextMessage = err instanceof ApiError ? err.message : 'Unable to create job';
      setMessage(nextMessage);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Screen>
      <SectionCard
        title="Factory dashboard"
        subtitle={
          user?.type === 'factory'
            ? `Logged in as ${user.name}`
            : 'Use a factory account to post jobs and view live hiring stats.'
        }
      >
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{loading ? '...' : summary.openJobs}</Text>
            <Text style={styles.statLabel}>Open jobs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{loading ? '...' : summary.totalApplications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{loading ? '...' : summary.shortlisted}</Text>
            <Text style={styles.statLabel}>Shortlisted</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{loading ? '...' : summary.hires}</Text>
            <Text style={styles.statLabel}>Hires</Text>
          </View>
        </View>

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="Post a new job" subtitle="">
        <InputField icon="briefcase-outline" placeholder="Job title" value={title} onChangeText={setTitle} />
        <InputField icon="location-outline" placeholder="Industrial area" value={area} onChangeText={setArea} />
        <InputField icon="time-outline" placeholder="Shift" value={shift} onChangeText={setShift} />
        <InputField
          icon="document-text-outline"
          placeholder="Job description"
          value={description}
          onChangeText={setDescription}
        />
        <InputField
          icon="build-outline"
          placeholder="Skills comma separated"
          value={skills}
          onChangeText={setSkills}
        />
        <View style={styles.inlineInputs}>
          <View style={{ flex: 1 }}>
            <InputField icon="cash-outline" placeholder="Min pay" value={payMin} onChangeText={setPayMin} />
          </View>
          <View style={{ flex: 1 }}>
            <InputField icon="cash-outline" placeholder="Max pay" value={payMax} onChangeText={setPayMax} />
          </View>
        </View>
        <Pressable style={styles.primaryButton} onPress={handleCreateJob} disabled={creating}>
          <Text style={styles.primaryButtonText}>{creating ? 'Posting...' : 'Post job'}</Text>
        </Pressable>
      </SectionCard>


<SectionCard title="Live pipeline" subtitle="Open job-wise candidate pipeline for shortlist and hire">
  <Pressable style={styles.pipelineButton} onPress={() => router.push('/factory/pipeline')}>
    <Ionicons name="git-network-outline" size={20} color={colors.textInverse} />
    <Text style={styles.pipelineButtonText}>Open candidate pipeline</Text>
  </Pressable>

  {jobs.length ? (
    <View style={styles.jobList}>
      {jobs.slice(0, 3).map((job) => (
        <View key={job.id} style={styles.jobListCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobListTitle}>{job.role}</Text>
            <Text style={styles.jobListText}>{job.area} • {job.shift}</Text>
          </View>
          <Pressable style={styles.jobListAction} onPress={() => router.push('/factory/pipeline')}>
            <Text style={styles.jobListActionText}>View</Text>
          </Pressable>
        </View>
      ))}
    </View>
  ) : (
    <Text style={styles.helperText}>Post a job to start receiving applications and manage the pipeline.</Text>
  )}
</SectionCard>

      <SectionCard title="Factory actions">
        <View style={styles.grid}>
          <View style={styles.actionCard}>
            <Ionicons name="search-outline" size={24} color={colors.primary} />
            <Text style={styles.actionTitle}>Search workers</Text>
            <Text style={styles.actionText}>Use the Talent tab to search live worker profiles by area and role.</Text>
          </View>
          <View style={styles.actionCard}>
            <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
            <Text style={styles.actionTitle}>Manage jobs</Text>
            <Text style={styles.actionText}>Create openings and move candidates from applied to shortlisted to hired.</Text>
          </View>
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statBox: {
    width: '48%',
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 14,
  },
  statValue: { color: colors.textInverse, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  grid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 22, padding: 16 },
  actionTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 },
  actionText: { color: colors.textSoft, marginTop: 6, lineHeight: 19, fontSize: 12 },
  messageBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 12,
  },
  messageText: { color: '#1d4ed8', lineHeight: 20 },
  inlineInputs: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.textInverse, fontWeight: '800' },
  pipelineButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pipelineButtonText: { color: colors.textInverse, fontWeight: '800' },
  jobList: { gap: 10 },
  jobListCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  jobListTitle: { color: colors.text, fontWeight: '800' },
  jobListText: { color: colors.textSoft, marginTop: 4, fontSize: 12 },
  jobListAction: {
    backgroundColor: colors.panel,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  jobListActionText: { color: colors.textInverse, fontWeight: '700', fontSize: 12 },
  helperText: { color: colors.textSoft, lineHeight: 20 },
});
