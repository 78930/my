import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../components/ui/Screen';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { listMyApplications, listJobApplications } from '../services/applications';
import { listFactoryJobs } from '../services/factory';
import { clearAllNotifications } from '../lib/notifications';

type NotiItem = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  onPress?: () => void;
};

const WORKER_STATUS_CONFIG: Record<string, {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  body: (job: string) => string;
}> = {
  SHORTLISTED: { icon: 'star',            iconColor: '#d97706', iconBg: '#fffbeb', title: 'You were shortlisted!', body: (j) => `Great news — a factory shortlisted you for "${j}". Keep your profile updated.` },
  HIRED:       { icon: 'checkmark-circle', iconColor: '#16a34a', iconBg: '#f0fdf4', title: 'You got hired!',        body: (j) => `Congratulations! You have been hired for "${j}".` },
  REJECTED:    { icon: 'close-circle',    iconColor: '#b91c1c', iconBg: '#fef2f2', title: 'Application update',    body: (j) => `Your application for "${j}" was not selected this time. Keep applying!` },
  APPLIED:     { icon: 'paper-plane',     iconColor: colors.primary, iconBg: '#eff6ff', title: 'Application submitted', body: (j) => `Your application for "${j}" has been received.` },
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
                  return {
                    id: a.id,
                    icon: cfg.icon,
                    iconColor: cfg.iconColor,
                    iconBg: cfg.iconBg,
                    title: cfg.title,
                    body: cfg.body(jobLabel),
                    time: formatRelative(a.updatedAt || a.createdAt),
                    onPress,
                  };
                })
            );
          }
        } else if (isFactory) {
          const jobs = await listFactoryJobs(token);
          if (!jobs.length) {
            if (!cancelled) setItems([]);
            return;
          }
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
                  return { id: app.id, icon: 'person-add-outline' as const, iconColor: colors.primary, iconBg: '#eff6ff', title: 'New applicant', body: `${workerName} applied for your "${role}" opening.`, time: formatRelative(app.updatedAt || app.createdAt), onPress };
                }
                if (app.status === 'SHORTLISTED') {
                  return { id: app.id, icon: 'star-outline' as const, iconColor: '#d97706', iconBg: '#fffbeb', title: 'Candidate shortlisted', body: `${workerName} is shortlisted for "${role}".`, time: formatRelative(app.updatedAt || app.createdAt), onPress };
                }
                return { id: app.id, icon: 'checkmark-circle-outline' as const, iconColor: '#16a34a', iconBg: '#f0fdf4', title: 'Worker hired', body: `You hired ${workerName} for "${role}".`, time: formatRelative(app.updatedAt || app.createdAt), onPress };
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
    ? 'Post jobs and share them with workers. New applicants will appear here.'
    : 'Apply to jobs to receive updates when factories shortlist or hire you.';
  const emptyBrowseTo = isFactory ? '/factory/post-job' : '/(tabs)/jobs';
  const emptyBrowseLabel = isFactory ? 'Post a job' : 'Browse jobs';

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <SectionCard title="Loading…"><Text style={styles.muted}>Fetching your updates…</Text></SectionCard>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={52} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyBody}>{emptyBody}</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.replace(emptyBrowseTo as never)}>
            <Text style={styles.browseBtnText}>{emptyBrowseLabel}</Text>
          </Pressable>
        </View>
      ) : (
        <SectionCard title={`${items.length} update${items.length === 1 ? '' : 's'}`}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={styles.row}
              onPress={item.onPress}
              disabled={!item.onPress}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text style={styles.body}>{item.body}</Text>
              </View>
              {item.onPress ? <Ionicons name="chevron-forward" size={14} color={colors.textMuted} /> : null}
            </Pressable>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Job alerts">
        <View style={styles.alertRow}>
          <View style={[styles.iconWrap, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Push notifications enabled</Text>
            <Text style={styles.body}>
              {isFactory
                ? 'You will be alerted when new workers apply to your job posts.'
                : 'You will be alerted when factories shortlist or hire you, and when new matching jobs are posted.'}
            </Text>
          </View>
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: colors.textInverse, fontSize: 20, fontWeight: '800' },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  spacer: { width: 38 },
  muted: { color: colors.textSoft },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { color: colors.textInverse, fontWeight: '800', fontSize: 18 },
  emptyBody: { color: colors.textSoft, textAlign: 'center', lineHeight: 22 },
  browseBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  row: {
    flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  alertRow: { flexDirection: 'row', gap: 12 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontWeight: '800', fontSize: 14, flex: 1 },
  time: { color: colors.textMuted, fontSize: 11, marginLeft: 8 },
  body: { color: colors.textSoft, fontSize: 13, lineHeight: 18 },
});
