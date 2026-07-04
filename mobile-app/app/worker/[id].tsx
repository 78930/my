import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { workerCache } from '../../lib/workerCache';
import { useAuth } from '../../context/AuthContext';
import { listFactoryJobs } from '../../services/factory';
import { shortlistWorkerForJob } from '../../services/applications';
import { getWorkerById } from '../../services/workers';
import { Job, Worker } from '../../types';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

function TagPill({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
      <Text style={{ color, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>{text}</Text>
    </View>
  );
}

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

  useEffect(() => {
    if (worker || !id) return;
    setLoadingWorker(true);
    getWorkerById(id)
      .then((w) => { workerCache.set(w); setWorker(w); })
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

  const workerName = worker?.name || 'Job Seeker';
  const initials = workerName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Blue header ── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.back(); }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back-outline" size={20} color={WHITE} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: WHITE, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }} numberOfLines={1}>
                  {loadingWorker ? 'Profile' : workerName}
                </Text>
                {worker?.role ? (
                  <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{worker.role}</Text>
                ) : null}
              </View>
              {worker?.availableNow ? (
                <View style={{ backgroundColor: '#34D399', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: WHITE, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' }}>Open to work</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 16 }}>

            {loadingWorker ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading profile…</Text>
              </View>
            ) : workerError || !worker ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
                <Ionicons name="person-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Profile not found</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>{workerError || 'Go back and tap a job seeker from search.'}</Text>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); router.back(); }}
                  style={{ height: 48, backgroundColor: BRAND_BLUE, borderRadius: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: WHITE, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>Go Back</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Hero card */}
                <View style={{ backgroundColor: WHITE, borderRadius: 20, padding: 18, gap: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: BRAND_BLUE, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#0F172A', fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{worker.name}</Text>
                      <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 }}>{worker.role || 'Industrial Worker'}</Text>
                      {worker.headline ? (
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{worker.headline}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Stats 2×2 */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {[
                      { icon: 'location-outline' as const, label: 'Area', value: worker.area },
                      { icon: 'briefcase-outline' as const, label: 'Experience', value: worker.experience },
                      { icon: 'time-outline' as const, label: 'Shift', value: worker.shift },
                      { icon: 'cash-outline' as const, label: 'Salary', value: worker.salaryPreference },
                    ].map((s) => (
                      <View key={s.label} style={{ width: '47%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name={s.icon} size={12} color="#94A3B8" />
                          <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</Text>
                        </View>
                        <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }} numberOfLines={1}>{s.value || '—'}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Skills */}
                {worker.skills.length > 0 ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Skills</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {worker.skills.map((s) => (
                        <TagPill key={s} text={s} color={BRAND_BLUE} bg="#EBF0FF" />
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Certifications */}
                {worker.certifications.length > 0 ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Certifications</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {worker.certifications.map((c) => (
                        <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
                          <Ionicons name="ribbon-outline" size={12} color={ORANGE} />
                          <Text style={{ color: ORANGE, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Preferences */}
                {((worker.preferredAreas?.length ?? 0) > 0 || (worker.preferredRoles?.length ?? 0) > 0) ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Preferences</Text>
                    {(worker.preferredAreas?.length ?? 0) > 0 ? (
                      <View style={{ gap: 8 }}>
                        <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.3 }}>Preferred Areas</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {worker.preferredAreas!.map((a) => (
                            <View key={a} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
                              <Ionicons name="location-outline" size={12} color="#3B82F6" />
                              <Text style={{ color: '#3B82F6', fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>{a}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                    {(worker.preferredRoles?.length ?? 0) > 0 ? (
                      <View style={{ gap: 8 }}>
                        <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.3 }}>Preferred Roles</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {worker.preferredRoles!.map((r) => (
                            <TagPill key={r} text={r} color="#64748B" bg="#F1F5F9" />
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Factory shortlist action */}
                {isFactory ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Actions</Text>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (!shortlisted) openJobPicker(); }}
                      disabled={shortlisting || shortlisted}
                      style={{ height: 52, backgroundColor: shortlisted ? '#F0FDF4' : BRAND_BLUE, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                    >
                      {shortlisting
                        ? <ActivityIndicator size="small" color={WHITE} />
                        : <Ionicons name={shortlisted ? 'checkmark-circle' : 'star-outline'} size={20} color={shortlisted ? '#22C55E' : WHITE} />
                      }
                      <Text style={{ color: shortlisted ? '#15803D' : WHITE, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        {shortlisting ? 'Shortlisting…' : shortlisted ? 'Shortlisted' : 'Shortlist for a Job'}
                      </Text>
                    </Pressable>
                    <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12 }}>
                      <Ionicons name="information-circle-outline" size={15} color="#94A3B8" />
                      <Text style={{ flex: 1, color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 18 }}>
                        Shortlist this job seeker to express interest. Contact details are shared once they accept.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </>
            )}

            <View style={{ height: 16 }} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Job picker modal */}
      <Modal visible={showJobPicker} transparent animationType="slide" onRequestClose={() => setShowJobPicker(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setShowJobPicker(false)}>
          <View style={{ backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 14 }}>
            <Text style={{ color: '#0F172A', fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>Select job to shortlist for</Text>
            {jobs.length === 0 ? (
              <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', paddingVertical: 20 }}>No open jobs found. Post a job first.</Text>
            ) : (
              jobs.map((job) => (
                <Pressable
                  key={job.id}
                  onPress={() => { Haptics.selectionAsync(); handleShortlist(job.id); }}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="briefcase-outline" size={18} color={BRAND_BLUE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>{job.role}</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{job.area} • {job.shift}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </Pressable>
              ))
            )}
            <Pressable onPress={() => setShowJobPicker(false)} style={{ height: 48, backgroundColor: '#F1F5F9', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#475569', fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
