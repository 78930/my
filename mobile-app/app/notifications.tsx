import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { useAuth } from '../context/AuthContext';
import { listMyApplications, listJobApplications } from '../services/applications';
import { listFactoryJobs } from '../services/factory';
import { clearAllNotifications } from '../lib/notifications';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

type NotiVariant = 'warning' | 'success' | 'error' | 'brand';

type NotiItem = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  variant: NotiVariant;
  title: string;
  body: string;
  time: string;
  onPress?: () => void;
};

const VARIANT_STYLE: Record<NotiVariant, { bg: string; icon: string; border: string }> = {
  warning: { bg: '#FFF7ED', icon: ORANGE,     border: '#FED7AA' },
  success: { bg: '#F0FDF4', icon: '#22C55E',  border: '#BBF7D0' },
  error:   { bg: '#FEF2F2', icon: '#EF4444',  border: '#FECACA' },
  brand:   { bg: '#EBF0FF', icon: BRAND_BLUE, border: '#BFDBFE' },
};

const WORKER_STATUS_CONFIG: Record<string, {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  variant: NotiVariant;
  title: string;
  body: (job: string) => string;
}> = {
  SHORTLISTED: { icon: 'star',            variant: 'warning', title: 'You were shortlisted!', body: (j) => `Great news — an employer shortlisted you for "${j}". Keep your profile updated.` },
  HIRED:       { icon: 'checkmark-circle', variant: 'success', title: 'You got hired!',        body: (j) => `Congratulations! You have been hired for "${j}".` },
  REJECTED:    { icon: 'close-circle',    variant: 'error',   title: 'Application update',    body: (j) => `Your application for "${j}" was not selected this time. Keep applying!` },
  APPLIED:     { icon: 'paper-plane',     variant: 'brand',   title: 'Application submitted', body: (j) => `Your application for "${j}" has been received.` },
};

function formatRelative(dateStr?: string) {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const { token, isWorker, isFactory } = useAuth();
  const [items, setItems] = useState<NotiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearAllNotifications();
    let cancelled = false;

    async function load() {
      if (!token) { setLoading(false); return; }
      try {
        if (isWorker) {
          const apps = await listMyApplications(token);
          if (!cancelled) {
            setItems(
              [...apps]
                .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
                .map((a) => {
                  const cfg = WORKER_STATUS_CONFIG[a.status] ?? WORKER_STATUS_CONFIG.APPLIED;
                  const jobLabel = a.job?.title || a.job?.role || 'a job';
                  const onPress = a.status === 'HIRED'
                    ? () => router.push(`/worker/hire/${a.id}` as never)
                    : () => router.push('/worker/applications' as never);
                  return { id: a.id, icon: cfg.icon, variant: cfg.variant, title: cfg.title, body: cfg.body(jobLabel), time: formatRelative(a.updatedAt || a.createdAt), onPress };
                })
            );
          }
        } else if (isFactory) {
          const jobs = await listFactoryJobs(token);
          if (!jobs.length) { if (!cancelled) setItems([]); return; }
          const allAppsArrays = await Promise.all(jobs.map((job) => listJobApplications(token, job.id)));
          if (cancelled) return;
          const jobMap = new Map(jobs.map((j) => [j.id, j]));
          setItems(
            allAppsArrays
              .flat()
              .filter((a) => a.status !== 'REJECTED')
              .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
              .map((app) => {
                const job = jobMap.get(app.jobId);
                const workerName = app.worker?.fullName || app.worker?.name || 'A worker';
                const role = job?.role || 'a role';
                const onPress = () => router.push(`/factory/application/${app.id}?jobId=${app.jobId}` as never);
                if (app.status === 'APPLIED') {
                  return { id: app.id, icon: 'person-add-outline' as const, variant: 'brand' as const, title: 'New applicant', body: `${workerName} applied for your "${role}" opening.`, time: formatRelative(app.updatedAt || app.createdAt), onPress };
                }
                if (app.status === 'SHORTLISTED') {
                  return { id: app.id, icon: 'star-outline' as const, variant: 'warning' as const, title: 'Candidate shortlisted', body: `${workerName} is shortlisted for "${role}".`, time: formatRelative(app.updatedAt || app.createdAt), onPress };
                }
                return { id: app.id, icon: 'checkmark-circle-outline' as const, variant: 'success' as const, title: 'Job seeker hired', body: `You hired ${workerName} for "${role}".`, time: formatRelative(app.updatedAt || app.createdAt), onPress };
              })
          );
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, isWorker, isFactory]);

  const emptyBody = isFactory
    ? 'Post jobs and share them with job seekers. New applicants will appear here.'
    : 'Apply to jobs to receive updates when factories shortlist or hire you.';
  const emptyBrowseTo = isFactory ? '/factory/post-job' : '/(tabs)/jobs';
  const emptyBrowseLabel = isFactory ? 'Post a job' : 'Browse jobs';

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
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Notifications</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>
                  {loading ? 'Loading updates…' : `${items.length} update${items.length === 1 ? '' : 's'}`}
                </Text>
              </View>
              {items.length > 0 && (
                <View style={{ backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={{ color: WHITE, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>{items.length}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 12 }}>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Fetching your updates…</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={{ alignItems: 'center', gap: 16, paddingVertical: 48, paddingHorizontal: 20 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="notifications-off-outline" size={34} color={BRAND_BLUE} />
                </View>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: '#0F172A', fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' }}>No notifications yet</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', lineHeight: 20 }}>{emptyBody}</Text>
                </View>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace(emptyBrowseTo as never); }}
                  style={{ height: 50, backgroundColor: BRAND_BLUE, borderRadius: 16, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: WHITE, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>{emptyBrowseLabel}</Text>
                </Pressable>
              </View>
            ) : (
              items.map((item) => {
                const vs = VARIANT_STYLE[item.variant];
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => { if (item.onPress) { Haptics.selectionAsync(); item.onPress(); } }}
                    disabled={!item.onPress}
                    style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1.5, borderColor: vs.border }}
                  >
                    <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: vs.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ionicons name={item.icon} size={22} color={vs.icon} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', flex: 1 }}>{item.title}</Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', marginLeft: 8 }}>{item.time}</Text>
                      </View>
                      <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 18 }}>{item.body}</Text>
                    </View>
                    {item.onPress ? <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginTop: 2 }} /> : null}
                  </Pressable>
                );
              })
            )}

            {/* Push notification info card */}
            <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ionicons name="notifications-outline" size={22} color={BRAND_BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 4 }}>Push notifications enabled</Text>
                <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 18 }}>
                  {isFactory
                    ? 'You will be alerted when new job seekers apply to your job posts.'
                    : 'You will be alerted when factories shortlist or hire you, and when new matching jobs are posted.'}
                </Text>
              </View>
            </View>

            <View style={{ height: 16 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
