import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { WorkerProfile } from '../../types';

const BRAND_BLUE = '#1240C7';
const ICON_BLUE = '#5B8DFF';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

function profileCompleteness(p: WorkerProfile | null): { pct: number; missing: string[] } {
  if (!p) return { pct: 0, missing: ['skills', 'preferred areas', 'roles', 'headline'] };
  const checks: [boolean, string][] = [
    [!!p.headline, 'headline'],
    [p.skills.length > 0, 'skills'],
    [p.preferredAreas.length > 0, 'preferred areas'],
    [p.preferredRoles.length > 0, 'preferred roles'],
    [p.experienceYears > 0, 'experience'],
    [p.salaryMin > 0, 'salary expectation'],
  ];
  const done = checks.filter(([ok]) => ok).length;
  return {
    pct: Math.round((done / checks.length) * 100),
    missing: checks.filter(([ok]) => !ok).map(([, label]) => label),
  };
}

function ActionCard({
  icon, iconBg, iconColor, title, subtitle, onPress, badge,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
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

export default function HomeTab() {
  const { user, signOut, profile, isWorker } = useAuth();
  const workerProfile = isWorker ? (profile as WorkerProfile | null) : null;
  const { pct, missing } = profileCompleteness(workerProfile);
  const isOpenToWork = workerProfile?.isOpenToWork !== false;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

          {/* ── Blue header ─────────────────────────────────────── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Greeting */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>
                  {isWorker ? 'Job Seeker' : 'Employer'}
                </Text>
                <Text style={{ color: WHITE, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4, marginTop: 2 }}>
                  {`Hi, ${firstName}! 👋`}
                </Text>
              </View>
              {/* Action buttons */}
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
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 20 }}>

            {/* Worker: profile completeness */}
            {isWorker ? (
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
            ) : null}

            {/* Quick actions */}
            <View>
              <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 14 }}>Quick actions</Text>
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
