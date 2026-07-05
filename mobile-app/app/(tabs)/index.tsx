import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { WorkerProfile, Job, JobApplication, VerificationStatus } from '../../types';
import { listJobs } from '../../services/jobs';
import { listMyApplications } from '../../services/applications';

const BRAND_BLUE = '#1240C7';
const ICON_BLUE  = '#5B8DFF';
const ORANGE     = '#FF8C00';
const GOLD       = '#D97706';
const WHITE      = '#FFFFFF';

function profileCompleteness(p: WorkerProfile | null): { pct: number; missing: string[] } {
  if (!p) return { pct: 0, missing: ['skills', 'preferred areas', 'roles', 'headline'] };
  const checks: [boolean, string][] = [
    [!!p.headline,                'headline'],
    [p.skills.length > 0,         'skills'],
    [p.preferredAreas.length > 0, 'preferred areas'],
    [p.preferredRoles.length > 0, 'preferred roles'],
    [p.experienceYears > 0,       'experience'],
    [p.salaryMin > 0,             'salary expectation'],
  ];
  const done = checks.filter(([ok]) => ok).length;
  return {
    pct: Math.round((done / checks.length) * 100),
    missing: checks.filter(([ok]) => !ok).map(([, label]) => label),
  };
}

function ActionCard({ icon, iconBg, iconColor, title, subtitle, onPress, badge }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string; iconColor: string; title: string; subtitle: string;
  onPress: () => void; badge?: string;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ flex: 1, backgroundColor: WHITE, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        {badge ? (
          <View style={{ backgroundColor: ORANGE, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: WHITE, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View>
        <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 2 }}>{title}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 17 }}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function JobPill({ job }: { job: Job }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); router.push(`/jobs/${job.id}` as never); }}
      style={{ backgroundColor: WHITE, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name="briefcase-outline" size={18} color={BRAND_BLUE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>{job.title || job.role}</Text>
        <Text style={{ color: '#64748B', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }} numberOfLines={1}>
          {job.companyName} · {job.area} · {job.pay}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
    </Pressable>
  );
}

function VerifBanner({ status, onPress }: { status: VerificationStatus; onPress: () => void }) {
  if (status === 'VERIFIED') {
    return (
      <View style={{ backgroundColor: '#FEF3C7', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
        <Ionicons name="shield-checkmark" size={24} color={GOLD} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#92400E', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Profile Verified ✓</Text>
          <Text style={{ color: '#B45309', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Your gold badge is visible to employers</Text>
        </View>
      </View>
    );
  }
  if (status === 'PENDING') {
    return (
      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <Ionicons name="time-outline" size={22} color="#94A3B8" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#334155', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Verification under review</Text>
          <Text style={{ color: '#64748B', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Admin is reviewing your documents</Text>
        </View>
      </View>
    );
  }
  if (status === 'REJECTED') {
    return (
      <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }}
        style={{ backgroundColor: '#FEF2F2', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#FECACA' }}>
        <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#991B1B', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Verification rejected</Text>
          <Text style={{ color: '#B91C1C', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Tap to reapply from your profile</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="#FCA5A5" />
      </Pressable>
    );
  }
  // UNVERIFIED
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ backgroundColor: '#EBF0FF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: BRAND_BLUE + '33' }}>
      <Ionicons name="shield-outline" size={22} color={BRAND_BLUE} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: BRAND_BLUE, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Get verified</Text>
        <Text style={{ color: '#3B5BDB', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Upload your Aadhaar/PAN and get a gold badge</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={BRAND_BLUE} />
    </Pressable>
  );
}

export default function HomeTab() {
  const { user, token, signOut, profile, isWorker } = useAuth();
  const workerProfile = isWorker ? (profile as WorkerProfile | null) : null;
  const { pct, missing } = profileCompleteness(workerProfile);
  const isOpenToWork     = workerProfile?.isOpenToWork !== false;
  const verificationStatus = (workerProfile?.verificationStatus ?? 'UNVERIFIED') as VerificationStatus;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const [jobs, setJobs]             = useState<Job[]>([]);
  const [apps, setApps]             = useState<JobApplication[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (!isWorker) { setLoadingJobs(false); return; }
    let cancelled = false;
    async function load() {
      setLoadingJobs(true);
      try {
        const area = workerProfile?.preferredAreas?.[0] ?? '';
        const role = workerProfile?.preferredRoles?.[0] ?? '';
        const [jobsRes, appsRes] = await Promise.allSettled([
          listJobs({ area, role, page: 1 }),
          token ? listMyApplications(token) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.items.slice(0, 4));
        if (appsRes.status === 'fulfilled') setApps(appsRes.value as JobApplication[]);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorker, token]);

  const shortlistedCount = apps.filter((a) => a.status === 'SHORTLISTED').length;
  const hiredCount       = apps.filter((a) => a.status === 'HIRED').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

          {/* ── Blue header ─────────────────────────────────────── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>
                  {isWorker ? 'Job Seeker' : 'Employer'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <Text style={{ color: WHITE, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>
                    {`Hi, ${firstName}! 👋`}
                  </Text>
                  {isWorker && verificationStatus === 'VERIFIED' && (
                    <Ionicons name="shield-checkmark" size={18} color={GOLD} />
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); router.push('/notifications' as never); }}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="notifications-outline" size={20} color={WHITE} />
                </Pressable>
                <Pressable
                  onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await signOut(); router.replace('/auth/welcome'); }}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="log-out-outline" size={20} color={WHITE} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── White card body ─────────────────────────────────── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 16 }}>

            {/* Worker: verification banner */}
            {isWorker && (
              <VerifBanner
                status={verificationStatus}
                onPress={() => router.push('/(tabs)/profile')}
              />
            )}

            {/* Worker: profile completeness */}
            {isWorker && (
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/profile'); }}
                style={{ backgroundColor: WHITE, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: isOpenToWork ? '#22C55E' : '#94A3B8' }} />
                    <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {isOpenToWork ? 'Open to work' : 'Not looking right now'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: BRAND_BLUE, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>{pct}%</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>profile</Text>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                  </View>
                </View>
                <View style={{ height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: 6, width: `${pct}%` as `${number}%`, backgroundColor: pct >= 80 ? '#22C55E' : BRAND_BLUE, borderRadius: 3 }} />
                </View>
                {missing.length > 0 && pct < 100 ? (
                  <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 8 }}>
                    {`Add: ${missing.slice(0, 3).join(' · ')}${missing.length > 3 ? ` +${missing.length - 3} more` : ''}`}
                  </Text>
                ) : null}
              </Pressable>
            )}

            {/* Worker: application stats */}
            {isWorker && apps.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {([
                  { label: 'Applied', value: apps.length, icon: 'paper-plane-outline' as const, color: BRAND_BLUE, bg: '#EBF0FF' },
                  { label: 'Shortlisted', value: shortlistedCount, icon: 'star-outline' as const, color: ORANGE, bg: '#FFF7ED' },
                  { label: 'Hired', value: hiredCount, icon: 'checkmark-circle-outline' as const, color: '#22C55E', bg: '#F0FDF4' },
                ] as const).map((stat) => (
                  <Pressable
                    key={stat.label}
                    onPress={() => { Haptics.selectionAsync(); router.push('/worker/applications' as never); }}
                    style={{ flex: 1, backgroundColor: stat.bg, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name={stat.icon} size={16} color={stat.color} />
                    <Text style={{ color: stat.color, fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{stat.value}</Text>
                    <Text style={{ color: stat.color, fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', opacity: 0.75 }}>{stat.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Quick actions */}
            <View>
              <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 12 }}>Quick actions</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                {isWorker ? (
                  <>
                    <ActionCard icon="search-outline" iconBg="#EBF0FF" iconColor={BRAND_BLUE} title="Browse Jobs" subtitle="Search by area, role & shift" onPress={() => router.push('/(tabs)/jobs')} />
                    <ActionCard icon="document-attach-outline" iconBg="#FFF7ED" iconColor={ORANGE} title="Resume" subtitle="Build or upload your CV" onPress={() => router.push('/(tabs)/resume')} />
                  </>
                ) : (
                  <>
                    <ActionCard icon="add-circle-outline" iconBg="#EBF0FF" iconColor={BRAND_BLUE} title="Post a Job" subtitle="Reach job seekers fast" onPress={() => router.push('/factory/post-job' as never)} />
                    <ActionCard icon="people-outline" iconBg="#FFF7ED" iconColor={ORANGE} title="Pipeline" subtitle="Review applicants" onPress={() => router.push('/factory/pipeline' as never)} />
                  </>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {isWorker ? (
                  <>
                    <ActionCard icon="document-text-outline" iconBg="#F0FDF4" iconColor="#22C55E" title="Applications" subtitle="Track your apply status" onPress={() => router.push('/worker/applications' as never)} />
                    <ActionCard icon="bookmark-outline" iconBg="#EFF6FF" iconColor={ICON_BLUE} title="Saved Jobs" subtitle="Revisit bookmarked roles" onPress={() => router.push('/worker/saved' as never)} />
                  </>
                ) : (
                  <>
                    <ActionCard icon="briefcase-outline" iconBg="#F0FDF4" iconColor="#22C55E" title="My Jobs" subtitle="Manage your postings" onPress={() => router.push('/factory/my-jobs' as never)} />
                    <ActionCard icon="people-circle-outline" iconBg="#EFF6FF" iconColor={ICON_BLUE} title="Find Talent" subtitle="Search job seekers" onPress={() => router.push('/(tabs)/talent')} />
                  </>
                )}
              </View>
            </View>

            {/* Worker: jobs for you */}
            {isWorker && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold' }}>Jobs for you</Text>
                  <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/jobs'); }}>
                    <Text style={{ color: BRAND_BLUE, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>See all</Text>
                  </Pressable>
                </View>

                {loadingJobs ? (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <ActivityIndicator color={BRAND_BLUE} />
                  </View>
                ) : jobs.length === 0 ? (
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/jobs'); }}
                    style={{ backgroundColor: WHITE, borderRadius: 16, padding: 18, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0' }}
                  >
                    <Ionicons name="search-outline" size={28} color="#CBD5E1" />
                    <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>Browse open jobs</Text>
                  </Pressable>
                ) : (
                  <View style={{ gap: 10 }}>
                    {jobs.map((job) => <JobPill key={job.id} job={job} />)}
                  </View>
                )}
              </View>
            )}

            {/* Edit profile row */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/profile'); }}
              style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="create-outline" size={20} color={BRAND_BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>Edit profile</Text>
                <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>
                  {isWorker ? 'Update skills, areas and availability' : 'Update company details and coverage areas'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Settings row */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push('/settings' as never); }}
              style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="settings-outline" size={20} color="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>Settings</Text>
                <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Language, account preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
