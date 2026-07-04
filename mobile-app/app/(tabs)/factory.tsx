import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { FactoryDashboardSummary } from '../../types';
import { getFactoryDashboard } from '../../services/factory';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

const initialSummary: FactoryDashboardSummary = { openJobs: 0, totalApplications: 0, shortlisted: 0, hires: 0 };

function StatBox({ icon, label, value, color, bg }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string; color: string; bg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ color, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{value}</Text>
      <Text style={{ color, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', textAlign: 'center', opacity: 0.8 }}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon, iconBg, iconColor, title, subtitle, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string; iconColor: string; title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ backgroundColor: WHITE, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>{title}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </Pressable>
  );
}

export default function FactoryTab() {
  const { user, token, isFactory, signOut } = useAuth();
  const [summary, setSummary] = useState<FactoryDashboardSummary>(initialSummary);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token || !isFactory) { setLoading(false); return; }
      setLoading(true);
      try {
        const data = await getFactoryDashboard(token);
        if (!cancelled) setSummary(data);
      } catch { /* show zeros */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, isFactory]);

  const val = (n: number) => (loading ? '…' : String(n));

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Blue header ───────────────────────────────────── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>Employer</Text>
                <Text style={{ color: WHITE, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4, marginTop: 2 }}>
                  {`Hi, ${firstName}! 👋`}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/notifications' as never); }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="notifications-outline" size={20} color={WHITE} />
                </Pressable>
                <Pressable onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await signOut(); router.replace('/auth/welcome'); }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="log-out-outline" size={20} color={WHITE} />
                </Pressable>
              </View>
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatBox icon="briefcase-outline" label="Open Jobs" value={val(summary.openJobs)} color="#60A5FA" bg="rgba(96,165,250,0.18)" />
              <StatBox icon="people-outline" label="Applied" value={val(summary.totalApplications)} color="#A78BFA" bg="rgba(167,139,250,0.18)" />
              <StatBox icon="star-outline" label="Shortlisted" value={val(summary.shortlisted)} color={ORANGE} bg="rgba(255,140,0,0.18)" />
              <StatBox icon="checkmark-circle-outline" label="Hired" value={val(summary.hires)} color="#34D399" bg="rgba(52,211,153,0.18)" />
            </View>
          </View>

          {/* ── White body ────────────────────────────────────── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 14 }}>

            {/* First-job nudge */}
            {!loading && summary.openJobs === 0 ? (
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.push('/factory/post-job' as never); }}
                style={{ backgroundColor: '#EBF0FF', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: BRAND_BLUE + '33' }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: BRAND_BLUE, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="add-circle-outline" size={24} color={WHITE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND_BLUE, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Post your first job</Text>
                  <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 3, lineHeight: 18 }}>
                    No open jobs yet. Create an opening to start receiving applications.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={BRAND_BLUE} />
              </Pressable>
            ) : null}

            <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold' }}>Quick actions</Text>

            <ActionRow icon="add-circle-outline" iconBg="#EBF0FF" iconColor={BRAND_BLUE} title="Post a job" subtitle="Create a new opening with role, area, shift & pay" onPress={() => router.push('/factory/post-job' as never)} />
            <ActionRow icon="git-network-outline" iconBg="#FFF7ED" iconColor={ORANGE} title="Candidate pipeline" subtitle="Move applicants from applied → shortlisted → hired" onPress={() => router.push('/factory/pipeline' as never)} />
            <ActionRow icon="list-outline" iconBg="#F0FDF4" iconColor="#22C55E" title="My jobs" subtitle="View, close or reopen your posted openings" onPress={() => router.push('/factory/my-jobs' as never)} />
            <ActionRow icon="people-outline" iconBg="#EFF6FF" iconColor="#60A5FA" title="Search talent" subtitle="Browse live job seeker profiles by area & role" onPress={() => router.push('/(tabs)/talent')} />
            <ActionRow icon="business-outline" iconBg="#F8FAFC" iconColor="#475569" title="Company profile" subtitle="Update employer details, location and contact info" onPress={() => router.push('/(tabs)/profile')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
