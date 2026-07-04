import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { Job, JobApplication } from '../../types';
import { listFactoryJobs } from '../../services/factory';
import { hireApplication, listJobApplications, shortlistApplication } from '../../services/applications';
import { ApplicationCard } from '../../components/factory/ApplicationCard';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

function JobChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: active ? BRAND_BLUE : WHITE, borderWidth: 1.5, borderColor: active ? BRAND_BLUE : '#E2E8F0', maxWidth: 220 }}
    >
      <Text style={{ color: active ? WHITE : '#475569', fontSize: 13, fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium' }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

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
      if (!token || !isFactory) { setLoadingJobs(false); setError('Log in as an employer to access the pipeline.'); return; }
      setLoadingJobs(true); setError('');
      try {
        const data = await listFactoryJobs(token, { status: 'OPEN' });
        if (!cancelled) { setJobs(data); setSelectedJobId((cur) => cur || data[0]?.id || ''); }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load your jobs');
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    }
    loadJobs();
    return () => { cancelled = true; };
  }, [token, isFactory]);

  useEffect(() => {
    let cancelled = false;
    async function loadApplications() {
      if (!token || !selectedJobId || !isFactory) { setApplications([]); return; }
      setLoadingApplications(true);
      try {
        const data = await listJobApplications(token, selectedJobId);
        if (!cancelled) setApplications(data);
      } catch (err) {
        if (!cancelled) setNotice(err instanceof ApiError ? err.message : 'Unable to load applications');
      } finally {
        if (!cancelled) setLoadingApplications(false);
      }
    }
    loadApplications();
    return () => { cancelled = true; };
  }, [token, selectedJobId, isFactory]);

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId), [jobs, selectedJobId]);

  async function refreshApplications() {
    if (!token || !selectedJobId) return;
    const data = await listJobApplications(token, selectedJobId);
    setApplications(data);
  }

  async function handleShortlist(applicationId: string) {
    if (!token) return;
    setBusyApplicationId(applicationId); setNotice('');
    try { await shortlistApplication(token, applicationId); await refreshApplications(); setNotice('Candidate shortlisted.'); }
    catch (err) { setNotice(err instanceof ApiError ? err.message : 'Unable to shortlist candidate'); }
    finally { setBusyApplicationId(''); }
  }

  async function handleHire(applicationId: string, payload: { proposedPay: number; joiningDate?: string }) {
    if (!token) return;
    setBusyApplicationId(applicationId); setNotice('');
    try { await hireApplication(token, applicationId, payload); await refreshApplications(); setNotice('Candidate moved to hired.'); }
    catch (err) { setNotice(err instanceof ApiError ? err.message : 'Unable to complete hire'); }
    finally { setBusyApplicationId(''); }
  }

  const applied = applications.filter((a) => a.status === 'APPLIED').length;
  const shortlisted = applications.filter((a) => a.status === 'SHORTLISTED').length;
  const hired = applications.filter((a) => a.status === 'HIRED').length;
  const isNoticeSuccess = notice.includes('shortlisted') || notice.includes('hired');

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Blue header ── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.back(); }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back-outline" size={20} color={WHITE} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Pipeline</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Shortlist and hire job seekers</Text>
              </View>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); refreshApplications(); }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="refresh-outline" size={20} color={WHITE} />
              </Pressable>
            </View>

            {/* Pipeline stats */}
            {!loadingJobs && !error && applications.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(147,197,253,0.20)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: '#93C5FD', fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{applied}</Text>
                  <Text style={{ color: '#93C5FD', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Applied</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'rgba(255,140,0,0.20)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: ORANGE, fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{shortlisted}</Text>
                  <Text style={{ color: ORANGE, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Shortlisted</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'rgba(52,211,153,0.20)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: '#34D399', fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{hired}</Text>
                  <Text style={{ color: '#34D399', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Hired</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 14 }}>

            {/* Notice */}
            {notice ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: isNoticeSuccess ? '#F0FDF4' : '#FEF2F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isNoticeSuccess ? '#BBF7D0' : '#FECACA' }}>
                <Ionicons name={isNoticeSuccess ? 'checkmark-circle' : 'alert-circle'} size={18} color={isNoticeSuccess ? '#22C55E' : '#EF4444'} />
                <Text style={{ flex: 1, color: isNoticeSuccess ? '#15803D' : '#B91C1C', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{notice}</Text>
              </View>
            ) : null}

            {loadingJobs ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading your jobs…</Text>
              </View>
            ) : error ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
                <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Pipeline unavailable</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>{error}</Text>
              </View>
            ) : !jobs.length ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                <Ionicons name="briefcase-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>No jobs yet</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>Post a job to start building your candidate pipeline.</Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/factory/post-job' as never); }}
                  style={{ height: 50, backgroundColor: BRAND_BLUE, borderRadius: 16, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: WHITE, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Post a Job</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Job selector */}
                <View style={{ gap: 8 }}>
                  <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3, textTransform: 'uppercase' }}>Select Job</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {jobs.map((job) => (
                      <JobChip key={job.id} label={`${job.role} • ${job.area}`} active={selectedJobId === job.id} onPress={() => setSelectedJobId(job.id)} />
                    ))}
                  </ScrollView>
                </View>

                {/* Selected job summary */}
                {selectedJob ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#BFDBFE', gap: 6 }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>{selectedJob.role}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                      {selectedJob.area ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name="location-outline" size={13} color="#64748B" />
                          <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>{selectedJob.area}</Text>
                        </View>
                      ) : null}
                      {selectedJob.shift ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name="time-outline" size={13} color="#64748B" />
                          <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>{selectedJob.shift}</Text>
                        </View>
                      ) : null}
                      {selectedJob.pay ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name="cash-outline" size={13} color="#64748B" />
                          <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>{selectedJob.pay}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {loadingApplications ? (
                  <View style={{ alignItems: 'center', paddingVertical: 32, gap: 10 }}>
                    <ActivityIndicator size="small" color={BRAND_BLUE} />
                    <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>Fetching candidates…</Text>
                  </View>
                ) : !applications.length ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
                    <Ionicons name="people-outline" size={44} color="#94A3B8" />
                    <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>No applicants yet</Text>
                    <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>Share the job and wait for job seekers to apply.</Text>
                  </View>
                ) : (
                  applications.map((item) => (
                    <View key={item.id} style={{ gap: 6 }}>
                      <ApplicationCard
                        item={item}
                        busy={busyApplicationId === item.id}
                        onShortlist={handleShortlist}
                        onHire={handleHire}
                      />
                      <Pressable
                        onPress={() => { Haptics.selectionAsync(); router.push(`/factory/application/${item.id}?jobId=${selectedJobId}` as never); }}
                        style={{ height: 36, backgroundColor: '#F1F5F9', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Ionicons name="expand-outline" size={14} color="#475569" />
                        <Text style={{ color: '#475569', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>View full profile & reject</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </>
            )}

            <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
