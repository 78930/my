import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { Job } from '../../types';
import { getJobDetails, applyToJob } from '../../services/jobs';
import { isJobSaved, toggleSavedJob } from '../../services/savedJobs';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isWorker } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [applied, setApplied] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) { setLoading(false); setError('Missing job ID.'); return; }
    setLoading(true); setError('');
    Promise.all([getJobDetails(id), isJobSaved(id)])
      .then(([details, savedState]) => {
        if (!cancelled) { setJob(details); setSaved(savedState); }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load job details'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function handleApply() {
    if (!job) return;
    if (!token || !isWorker) { setNotice('Log in as a job seeker to apply.'); return; }
    setSubmitting(true); setNotice('');
    try {
      await applyToJob(token, job.id, note.trim() || undefined);
      setApplied(true); setNote(''); setNotice('Application submitted successfully.');
    } catch (err) { setNotice(err instanceof ApiError ? err.message : 'Unable to apply right now'); }
    finally { setSubmitting(false); }
  }

  async function handleSave() {
    if (!job) return;
    const nextSaved = await toggleSavedJob(job);
    setSaved(nextSaved);
    setNotice(nextSaved ? 'Job saved for later.' : 'Removed from saved jobs.');
  }

  const isNoticeGood = notice.includes('successfully') || notice.includes('saved');
  const isNoticeWarn = notice.includes('Log in') || notice.includes('already');

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>

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
                  {loading ? 'Job Details' : (job?.title || job?.role || 'Job Details')}
                </Text>
                {job?.company ? (
                  <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{job.company}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); handleSave(); }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: saved ? ORANGE : 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={WHITE} />
              </Pressable>
            </View>
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 16 }}>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading job details…</Text>
              </View>
            ) : error ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
                <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Unable to load job</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>{error}</Text>
              </View>
            ) : job ? (
              <>
                {/* Job overview card */}
                <View style={{ backgroundColor: WHITE, borderRadius: 20, padding: 18, gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <View>
                    <Text style={{ color: '#0F172A', fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.3 }}>{job.title || job.role}</Text>
                    {job.company ? <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 4 }}>{job.company}</Text> : null}
                  </View>

                  {/* Meta row */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                    {job.area ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="location-outline" size={15} color={BRAND_BLUE} />
                        </View>
                        <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{job.area}</Text>
                      </View>
                    ) : null}
                    {job.shift ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="time-outline" size={15} color={ORANGE} />
                        </View>
                        <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{job.shift}</Text>
                      </View>
                    ) : null}
                    {job.pay ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="cash-outline" size={15} color="#22C55E" />
                        </View>
                        <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{job.pay}</Text>
                      </View>
                    ) : null}
                    {job.employmentType ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="briefcase-outline" size={15} color="#64748B" />
                        </View>
                        <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{job.employmentType}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Status badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: (job.status || 'OPEN') === 'OPEN' ? '#22C55E' : '#94A3B8' }} />
                    <Text style={{ color: (job.status || 'OPEN') === 'OPEN' ? '#15803D' : '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                      {(job.status || 'OPEN') === 'OPEN' ? 'Actively hiring' : 'Position closed'}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {job.description ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>About this role</Text>
                    <Text style={{ color: '#475569', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 21 }}>{job.description}</Text>
                  </View>
                ) : null}

                {/* Skills */}
                {job.skills.length > 0 ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Skills required</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {job.skills.map((s) => (
                        <View key={s} style={{ backgroundColor: '#EBF0FF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                          <Text style={{ color: BRAND_BLUE, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Notice */}
                {notice ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: isNoticeGood ? '#F0FDF4' : isNoticeWarn ? '#FFF7ED' : '#FEF2F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isNoticeGood ? '#BBF7D0' : isNoticeWarn ? '#FED7AA' : '#FECACA' }}>
                    <Ionicons name={isNoticeGood ? 'checkmark-circle' : 'alert-circle'} size={18} color={isNoticeGood ? '#22C55E' : isNoticeWarn ? ORANGE : '#EF4444'} />
                    <Text style={{ flex: 1, color: isNoticeGood ? '#15803D' : isNoticeWarn ? '#92400E' : '#B91C1C', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{notice}</Text>
                  </View>
                ) : null}

                {/* Message note field */}
                {isWorker && !applied ? (
                  <View style={{ gap: 8 }}>
                    <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>Message to employer (optional)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5, borderColor: noteFocused ? BRAND_BLUE : '#E2E8F0', paddingHorizontal: 14, paddingVertical: 12, gap: 10, minHeight: 90 }}>
                      <Ionicons name="chatbox-outline" size={17} color={noteFocused ? BRAND_BLUE : '#94A3B8'} style={{ marginTop: 2 }} />
                      <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="Tell them why you're a great fit…"
                        placeholderTextColor="#CBD5E1"
                        multiline
                        onFocus={() => setNoteFocused(true)}
                        onBlur={() => setNoteFocused(false)}
                        textAlignVertical="top"
                        style={{ flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#0F172A' }}
                      />
                    </View>
                  </View>
                ) : null}

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); router.push('/worker/saved' as never); }}
                    style={{ flex: 1, height: 52, backgroundColor: '#F1F5F9', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#475569', fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Saved Jobs</Text>
                  </Pressable>
                  {applied ? (
                    <View style={{ flex: 2, height: 52, backgroundColor: '#F0FDF4', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                      <Text style={{ color: '#15803D', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>Applied!</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleApply(); }}
                      disabled={submitting || !isWorker}
                      style={{ flex: 2, height: 52, backgroundColor: isWorker ? BRAND_BLUE : '#94A3B8', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      {submitting
                        ? <ActivityIndicator size="small" color={WHITE} />
                        : <Ionicons name="paper-plane-outline" size={18} color={WHITE} />
                      }
                      <Text style={{ color: WHITE, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        {submitting ? 'Applying…' : isWorker ? 'Apply Now' : 'Workers Only'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </>
            ) : null}

            <View style={{ height: 16 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
