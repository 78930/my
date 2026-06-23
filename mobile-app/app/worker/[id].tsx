import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { workerCache } from '../../lib/workerCache';
import { useAuth } from '../../context/AuthContext';
import { listFactoryJobs } from '../../services/factory';
import { shortlistWorkerForJob } from '../../services/applications';
import { getWorkerById } from '../../services/workers';
import { Job, Worker } from '../../types';

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isFactory } = useAuth();

  const cached = workerCache.get(id ?? '');
  const [worker, setWorker] = useState<Worker | null>(cached);
  const [loadingWorker, setLoadingWorker] = useState(cached === null);
  const [workerError, setWorkerError] = useState('');

  const [shortlisting, setShortlisting] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobPicker, setShowJobPicker] = useState(false);

  // Fetch from API when not in cache
  useEffect(() => {
    if (worker || !id) return;
    setLoadingWorker(true);
    getWorkerById(id)
      .then((w) => {
        workerCache.set(w);
        setWorker(w);
      })
      .catch(() => setWorkerError('Could not load worker profile. Please go back and try again.'))
      .finally(() => setLoadingWorker(false));
  }, [id]);

  async function openJobPicker() {
    if (!token) return;
    try {
      const data = await listFactoryJobs(token, { status: 'OPEN' });
      setJobs(data);
      setShowJobPicker(true);
    } catch {
      Alert.alert('Error', 'Could not load your open jobs. Please try again.');
    }
  }

  async function handleShortlist(jobId: string) {
    if (!token || !worker) return;
    setShowJobPicker(false);
    setShortlisting(true);
    try {
      await shortlistWorkerForJob(token, jobId, worker.id);
      setShortlisted(true);
      Alert.alert('Shortlisted!', `${worker.name} has been added to your shortlist.`);
    } catch {
      Alert.alert('Error', 'Could not shortlist this worker. Please try again.');
    } finally {
      setShortlisting(false);
    }
  }

  if (loadingWorker) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
          </Pressable>
          <Text style={styles.topTitle}>Worker profile</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.notFound}>
          <Ionicons name="hourglass-outline" size={40} color={colors.textMuted} />
          <Text style={styles.notFoundText}>Loading profile…</Text>
        </View>
      </Screen>
    );
  }

  if (workerError || !worker) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
          </Pressable>
          <Text style={styles.topTitle}>Worker profile</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.notFound}>
          <Ionicons name="person-outline" size={48} color={colors.textMuted} />
          <Text style={styles.notFoundText}>{workerError || 'Profile not found. Go back and tap a worker from search.'}</Text>
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const initial = (worker.name || 'W').charAt(0).toUpperCase();

  return (
    <Screen>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>Worker profile</Text>
        <View style={styles.spacer} />
      </View>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{worker.name}</Text>
            <Text style={styles.heroRole}>{worker.role || 'Industrial Worker'}</Text>
            {worker.headline ? <Text style={styles.heroHeadline}>{worker.headline}</Text> : null}
          </View>
          {worker.availableNow ? (
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open to work</Text>
            </View>
          ) : null}
        </View>

        {/* Quick stats */}
        <View style={styles.statsGrid}>
          <StatBox icon="location-outline" label="Area" value={worker.area} />
          <StatBox icon="briefcase-outline" label="Experience" value={worker.experience} />
          <StatBox icon="time-outline" label="Shift" value={worker.shift} />
          <StatBox icon="cash-outline" label="Salary" value={worker.salaryPreference} />
        </View>
      </View>

      {/* Skills */}
      {worker.skills.length > 0 ? (
        <SectionCard title="Skills">
          <View style={styles.chipsWrap}>
            {worker.skills.map((s) => (
              <View key={s} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {/* Certifications */}
      {worker.certifications.length > 0 ? (
        <SectionCard title="Certifications">
          <View style={styles.chipsWrap}>
            {worker.certifications.map((c) => (
              <View key={c} style={[styles.skillChip, styles.certChip]}>
                <Ionicons name="ribbon-outline" size={12} color="#7c3aed" />
                <Text style={[styles.skillText, { color: '#7c3aed' }]}>{c}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {/* Preferred areas / roles */}
      {(worker.preferredAreas?.length ?? 0) > 0 || (worker.preferredRoles?.length ?? 0) > 0 ? (
        <SectionCard title="Preferences">
          {(worker.preferredAreas?.length ?? 0) > 0 ? (
            <>
              <Text style={styles.prefLabel}>Preferred areas</Text>
              <View style={styles.chipsWrap}>
                {worker.preferredAreas!.map((a) => (
                  <View key={a} style={[styles.skillChip, styles.areaChip]}>
                    <Ionicons name="location-outline" size={12} color="#0369a1" />
                    <Text style={[styles.skillText, { color: '#0369a1' }]}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
          {(worker.preferredRoles?.length ?? 0) > 0 ? (
            <>
              <Text style={[styles.prefLabel, { marginTop: 12 }]}>Preferred roles</Text>
              <View style={styles.chipsWrap}>
                {worker.preferredRoles!.map((r) => (
                  <View key={r} style={styles.skillChip}>
                    <Text style={styles.skillText}>{r}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Factory actions */}
      {isFactory ? (
        <SectionCard title="Actions">
          <Pressable
            style={[styles.actionBtn, shortlisted && styles.actionBtnDone]}
            onPress={shortlisted ? undefined : openJobPicker}
            disabled={shortlisting}
          >
            <Ionicons
              name={shortlisted ? 'checkmark-circle' : 'star-outline'}
              size={18}
              color="#fff"
            />
            <Text style={styles.actionBtnText}>
              {shortlisting ? 'Shortlisting…' : shortlisted ? 'Shortlisted' : 'Shortlist for a job'}
            </Text>
          </Pressable>

          <View style={styles.contactNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.contactNoteText}>
              Shortlist a worker to express interest. Contact details are shared once the worker accepts.
            </Text>
          </View>
        </SectionCard>
      ) : null}

      {/* Job picker bottom sheet */}
      {showJobPicker ? (
        <Pressable style={styles.overlay} onPress={() => setShowJobPicker(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select job to shortlist for</Text>
            {jobs.length === 0 ? (
              <Text style={styles.sheetEmpty}>No open jobs found. Post a job first.</Text>
            ) : (
              jobs.map((job) => (
                <Pressable key={job.id} style={styles.sheetOption} onPress={() => handleShortlist(job.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetOptionTitle}>{job.role}</Text>
                    <Text style={styles.sheetOptionSub}>{job.area} • {job.shift}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              ))
            )}
            <Pressable style={styles.sheetCancel} onPress={() => setShowJobPicker(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function StatBox({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={statBox.wrap}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={statBox.label}>{label}</Text>
      <Text style={statBox.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const statBox = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  value: { color: colors.textInverse, fontSize: 12, fontWeight: '800', textAlign: 'center' },
});

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: colors.textInverse, fontSize: 18, fontWeight: '800' },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { width: 38 },
  heroCard: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  heroName: { color: colors.textInverse, fontWeight: '800', fontSize: 18 },
  heroRole: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  heroHeadline: { color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 17 },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(22,163,74,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a' },
  openText: { color: '#16a34a', fontSize: 11, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillText: { color: '#c2410c', fontWeight: '700', fontSize: 12 },
  certChip: { backgroundColor: '#f5f3ff' },
  areaChip: { backgroundColor: '#f0f9ff' },
  prefLabel: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  actionBtnDone: { backgroundColor: '#16a34a' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  contactNote: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
  },
  contactNoteText: { color: colors.textSoft, fontSize: 12, lineHeight: 18, flex: 1 },
  notFound: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  notFoundText: { color: colors.textSoft, textAlign: 'center', lineHeight: 22, paddingHorizontal: 24 },
  backLink: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10 },
  backLinkText: { color: '#fff', fontWeight: '800' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 10,
  },
  sheetTitle: { color: colors.text, fontWeight: '800', fontSize: 17, marginBottom: 4 },
  sheetEmpty: { color: colors.textSoft, textAlign: 'center', paddingVertical: 16 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sheetOptionTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  sheetOptionSub: { color: colors.textSoft, fontSize: 12, marginTop: 2 },
  sheetCancel: { backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  sheetCancelText: { color: colors.text, fontWeight: '800', fontSize: 15 },
});
