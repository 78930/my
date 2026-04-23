import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pill } from '../../components/ui/Pill';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { Job, JobApplication } from '../../types';
import { listFactoryJobs } from '../../services/factory';
import { hireApplication, listJobApplications, shortlistApplication } from '../../services/applications';
import { ApplicationCard } from '../../components/factory/ApplicationCard';

export default function PipelineScreen() {
  const { token, isFactory } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [busyApplicationId, setBusyApplicationId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      if (!token || !isFactory) {
        setLoadingJobs(false);
        setError('Log in as a factory account to access the hiring pipeline.');
        return;
      }

      setLoadingJobs(true);
      setError('');
      try {
        const data = await listFactoryJobs(token, { status: 'OPEN' });
        if (!cancelled) {
          setJobs(data);
          setSelectedJobId((current) => current || data[0]?.id || '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Unable to load factory jobs');
        }
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    }

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, [token, isFactory]);

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      if (!token || !selectedJobId || !isFactory) {
        setApplications([]);
        return;
      }

      setLoadingApplications(true);
      try {
        const data = await listJobApplications(token, selectedJobId);
        if (!cancelled) setApplications(data);
      } catch (err) {
        if (!cancelled) {
          setNotice(err instanceof ApiError ? err.message : 'Unable to load applications');
        }
      } finally {
        if (!cancelled) setLoadingApplications(false);
      }
    }

    loadApplications();
    return () => {
      cancelled = true;
    };
  }, [token, selectedJobId, isFactory]);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId), [jobs, selectedJobId]);

  async function refreshApplications() {
    if (!token || !selectedJobId) return;
    const data = await listJobApplications(token, selectedJobId);
    setApplications(data);
  }

  async function handleShortlist(applicationId: string) {
    if (!token) return;
    setBusyApplicationId(applicationId);
    setNotice('');
    try {
      await shortlistApplication(token, applicationId);
      await refreshApplications();
      setNotice('Candidate shortlisted.');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Unable to shortlist candidate');
    } finally {
      setBusyApplicationId('');
    }
  }

  async function handleHire(applicationId: string, payload: { proposedPay: number; joiningDate?: string }) {
    if (!token) return;
    setBusyApplicationId(applicationId);
    setNotice('');
    try {
      await hireApplication(token, applicationId, payload);
      await refreshApplications();
      setNotice('Candidate moved to hired.');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Unable to complete hire');
    } finally {
      setBusyApplicationId('');
    }
  }

  return (
    <Screen>
      <SectionCard
        title="Candidate pipeline"
        subtitle="Shortlist and hire workers against your live job posts"
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={18} color={colors.textInverse} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable style={styles.refreshButton} onPress={() => refreshApplications()}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        {notice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Select job</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {jobs.map((job) => (
            <Pill
              key={job.id}
              label={`${job.role} • ${job.area}`}
              active={selectedJobId === job.id}
              onPress={() => setSelectedJobId(job.id)}
            />
          ))}
        </ScrollView>

        {selectedJob ? (
          <View style={styles.jobSummary}>
            <Text style={styles.jobTitle}>{selectedJob.role}</Text>
            <Text style={styles.jobMeta}>{selectedJob.company} • {selectedJob.area} • {selectedJob.shift}</Text>
            <Text style={styles.jobMeta}>{selectedJob.pay} • {selectedJob.skills.slice(0, 4).join(', ') || 'Skills not specified'}</Text>
          </View>
        ) : null}
      </SectionCard>

      {loadingJobs ? <EmptyState title="Loading jobs" message="Fetching your factory job posts." /> : null}
      {!loadingJobs && error ? <EmptyState title="Pipeline unavailable" message={error} /> : null}
      {!loadingJobs && !error && !jobs.length ? (
        <EmptyState title="No factory jobs yet" message="Post a job in the Factory tab to start building your candidate pipeline." />
      ) : null}
      {!loadingJobs && !error && jobs.length && loadingApplications ? (
        <EmptyState title="Loading applications" message="Fetching candidates for the selected job." />
      ) : null}
      {!loadingJobs && !error && jobs.length && !loadingApplications && !applications.length ? (
        <EmptyState title="No applicants yet" message="Share the job and wait for worker applications to appear here." />
      ) : null}
      {!loadingJobs && !error && !loadingApplications
        ? applications.map((item) => (
            <ApplicationCard
              key={item.id}
              item={item}
              busy={busyApplicationId === item.id}
              onShortlist={handleShortlist}
              onHire={handleHire}
            />
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  backButton: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  backText: { color: colors.textInverse, fontWeight: '800' },
  refreshButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  refreshText: { color: colors.primary, fontWeight: '800' },
  label: { color: colors.text, fontWeight: '700' },
  row: { gap: 8 },
  noticeBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 12,
  },
  noticeText: { color: '#1d4ed8', lineHeight: 20 },
  jobSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  jobTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  jobMeta: { color: colors.textSoft, lineHeight: 20, fontSize: 12 },
});
