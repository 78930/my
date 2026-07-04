import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../components/ui/Text';
import { useAuth } from '../../../context/AuthContext';
import { ApiError } from '../../../lib/api';
import { JobApplication } from '../../../types';
import { listJobApplications, shortlistApplication, hireApplication, rejectApplication } from '../../../services/applications';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

type AppStatus = 'APPLIED' | 'SHORTLISTED' | 'HIRED' | 'REJECTED';

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string }> = {
  APPLIED:     { label: 'Applied',     color: BRAND_BLUE, bg: '#EBF0FF' },
  SHORTLISTED: { label: 'Shortlisted', color: ORANGE,     bg: '#FFF7ED' },
  HIRED:       { label: 'Hired',       color: '#22C55E',  bg: '#F0FDF4' },
  REJECTED:    { label: 'Rejected',    color: '#EF4444',  bg: '#FEF2F2' },
};

function TagPill({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>{text}</Text>
    </View>
  );
}

function MetaBox({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={{ width: '47%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name={icon} size={12} color="#94A3B8" />
        <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</Text>
      </View>
      <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{value || '—'}</Text>
    </View>
  );
}

function PayField({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 12, borderWidth: 1.5, borderColor: focused ? BRAND_BLUE : '#E2E8F0', paddingHorizontal: 12, height: 46, gap: 8 }}>
        <Ionicons name="cash-outline" size={16} color={focused ? BRAND_BLUE : '#94A3B8'} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          keyboardType="numeric"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#0F172A', paddingVertical: 0 }}
        />
      </View>
    </View>
  );
}

function DateField({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 12, borderWidth: 1.5, borderColor: focused ? BRAND_BLUE : '#E2E8F0', paddingHorizontal: 12, height: 46, gap: 8 }}>
        <Ionicons name="calendar-outline" size={16} color={focused ? BRAND_BLUE : '#94A3B8'} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#0F172A', paddingVertical: 0 }}
        />
      </View>
    </View>
  );
}

export default function ApplicationDetailScreen() {
  const { id, jobId } = useLocalSearchParams<{ id: string; jobId: string }>();
  const { token, isFactory } = useAuth();

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeOk, setNoticeOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [proposedPay, setProposedPay] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token || !isFactory || !id || !jobId) { setLoading(false); setError('Missing application or job information.'); return; }
      setLoading(true); setError('');
      try {
        const items = await listJobApplications(token, jobId);
        const found = items.find((a) => a.id === id);
        if (!cancelled) {
          if (found) { setApplication(found); setProposedPay(String(found.worker.salaryMin || '')); }
          else setError('Application not found.');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load application');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, isFactory, id, jobId]);

  async function handleShortlist() {
    if (!token || !application) return;
    setBusy(true); setNotice('');
    try { const u = await shortlistApplication(token, application.id); setApplication(u); setNotice('Candidate shortlisted.'); setNoticeOk(true); }
    catch (err) { setNotice(err instanceof ApiError ? err.message : 'Unable to shortlist'); setNoticeOk(false); }
    finally { setBusy(false); }
  }

  async function handleHire() {
    if (!token || !application) return;
    setBusy(true); setNotice('');
    try {
      await hireApplication(token, application.id, { proposedPay: Number(proposedPay || 0), joiningDate: joiningDate.trim() || undefined });
      const items = await listJobApplications(token, jobId);
      const u = items.find((a) => a.id === application.id);
      if (u) setApplication(u);
      setNotice('Hire offer sent to the candidate.'); setNoticeOk(true);
    } catch (err) { setNotice(err instanceof ApiError ? err.message : 'Unable to hire'); setNoticeOk(false); }
    finally { setBusy(false); }
  }

  async function handleReject() {
    if (!token || !application) return;
    setBusy(true); setNotice('');
    try { const u = await rejectApplication(token, application.id); setApplication(u); setNotice('Application rejected.'); setNoticeOk(true); }
    catch (err) { setNotice(err instanceof ApiError ? err.message : 'Unable to reject'); setNoticeOk(false); }
    finally { setBusy(false); }
  }

  const status = (application?.status ?? 'APPLIED') as AppStatus;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.APPLIED;
  const canShortlist = status === 'APPLIED';
  const canHire = status === 'APPLIED' || status === 'SHORTLISTED';
  const canReject = status !== 'HIRED' && status !== 'REJECTED';
  const workerName = application?.worker.name || 'Candidate';
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
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Application</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Review candidate profile</Text>
              </View>
              {application ? (
                <View style={{ backgroundColor: statusCfg.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: statusCfg.color, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>{statusCfg.label}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 16 }}>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading application…</Text>
              </View>
            ) : error ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
                <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Unable to load</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>{error}</Text>
              </View>
            ) : application ? (
              <>
                {/* Candidate card */}
                <View style={{ backgroundColor: WHITE, borderRadius: 20, padding: 18, gap: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Candidate</Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: BRAND_BLUE, fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>{workerName}</Text>
                      {application.worker.headline ? (
                        <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{application.worker.headline}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Meta grid */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    <MetaBox icon="briefcase-outline" label="Experience" value={application.worker.experience} />
                    <MetaBox icon="cash-outline" label="Salary Min" value={application.worker.salaryPreference} />
                    <MetaBox icon="time-outline" label="Availability" value={application.worker.availability || 'Available'} />
                    <MetaBox icon="swap-horizontal-outline" label="Shift" value={application.worker.shift} />
                  </View>

                  {/* Preferred areas */}
                  {(application.worker.preferredAreas ?? []).length > 0 ? (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.3 }}>Preferred Areas</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {(application.worker.preferredAreas ?? []).map((a) => (
                          <TagPill key={a} text={a} color="#64748B" bg="#F1F5F9" />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Preferred roles */}
                  {(application.worker.preferredRoles ?? []).length > 0 ? (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.3 }}>Preferred Roles</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {(application.worker.preferredRoles ?? []).map((r) => (
                          <TagPill key={r} text={r} color={ORANGE} bg="#FFF7ED" />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Skills */}
                  {application.worker.skills.length > 0 ? (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.3 }}>Skills</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {application.worker.skills.map((s) => (
                          <TagPill key={s} text={s} color={BRAND_BLUE} bg="#EBF0FF" />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Certifications */}
                  {application.worker.certifications.length > 0 ? (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.3 }}>Certifications</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {application.worker.certifications.map((c) => (
                          <TagPill key={c} text={c} color="#64748B" bg="#F1F5F9" />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Phone */}
                  {application.workerPhone ? (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${application.workerPhone}`)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' }}
                    >
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="call-outline" size={18} color={WHITE} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#15803D', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>{application.workerPhone}</Text>
                        <Text style={{ color: '#4ADE80', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 1 }}>Tap to call</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#22C55E" />
                    </Pressable>
                  ) : null}

                  {/* View full profile */}
                  {application.worker.id ? (
                    <Pressable
                      onPress={() => { Haptics.selectionAsync(); router.push(`/worker/${application.worker.id}` as never); }}
                      style={{ height: 42, backgroundColor: '#F1F5F9', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <Ionicons name="person-outline" size={16} color="#475569" />
                      <Text style={{ color: '#475569', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>View full profile</Text>
                      <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Candidate note */}
                {application.note ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Candidate Note</Text>
                    <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#EBF0FF', borderRadius: 12, padding: 12 }}>
                      <Ionicons name="chatbox-ellipses-outline" size={16} color={BRAND_BLUE} style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, color: '#1E40AF', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 20 }}>{application.note}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Actions */}
                <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Actions</Text>

                  {notice ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: noticeOk ? '#F0FDF4' : '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: noticeOk ? '#BBF7D0' : '#FECACA' }}>
                      <Ionicons name={noticeOk ? 'checkmark-circle' : 'alert-circle'} size={16} color={noticeOk ? '#22C55E' : '#EF4444'} />
                      <Text style={{ flex: 1, color: noticeOk ? '#15803D' : '#B91C1C', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{notice}</Text>
                    </View>
                  ) : null}

                  {canHire ? (
                    <>
                      <PayField label="Proposed Pay (₹)" value={proposedPay} onChangeText={setProposedPay} placeholder="e.g. 18000" />
                      <DateField label="Joining Date (YYYY-MM-DD)" value={joiningDate} onChangeText={setJoiningDate} placeholder="e.g. 2024-02-01" />
                    </>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {canShortlist ? (
                      <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleShortlist(); }}
                        disabled={busy}
                        style={{ flex: 1, height: 46, backgroundColor: '#FFF7ED', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                      >
                        {busy ? <ActivityIndicator size="small" color={ORANGE} /> : <Ionicons name="star-outline" size={16} color={ORANGE} />}
                        <Text style={{ color: ORANGE, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Shortlist</Text>
                      </Pressable>
                    ) : null}
                    {canHire ? (
                      <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleHire(); }}
                        disabled={busy}
                        style={{ flex: 1, height: 46, backgroundColor: BRAND_BLUE, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                      >
                        {busy ? <ActivityIndicator size="small" color={WHITE} /> : <Ionicons name="checkmark-circle-outline" size={16} color={WHITE} />}
                        <Text style={{ color: WHITE, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Hire</Text>
                      </Pressable>
                    ) : null}
                    {canReject ? (
                      <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleReject(); }}
                        disabled={busy}
                        style={{ flex: 1, height: 46, backgroundColor: '#FEF2F2', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                      >
                        {busy ? <ActivityIndicator size="small" color="#EF4444" /> : <Ionicons name="close-circle-outline" size={16} color="#EF4444" />}
                        <Text style={{ color: '#EF4444', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Reject</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  {status === 'HIRED' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12 }}>
                      <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                      <Text style={{ flex: 1, color: '#15803D', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>Hire offer sent — awaiting confirmation</Text>
                    </View>
                  ) : null}

                  {status === 'REJECTED' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 }}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text style={{ flex: 1, color: '#B91C1C', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>This application has been rejected</Text>
                    </View>
                  ) : null}
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
