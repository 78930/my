import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../components/ui/Screen';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { listMyApplications } from '../services/applications';
import { JobApplication } from '../types';
import { clearAllNotifications } from '../lib/notifications';

type NotiItem = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
};

const STATUS_CONFIG: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; iconColor: string; iconBg: string; title: string; body: (job: string) => string }> = {
  SHORTLISTED: { icon: 'star', iconColor: '#d97706', iconBg: '#fffbeb', title: 'You were shortlisted!', body: (job) => `Great news — a factory shortlisted you for "${job}". Keep your profile updated.` },
  HIRED:       { icon: 'checkmark-circle', iconColor: '#16a34a', iconBg: '#f0fdf4', title: 'You got hired!', body: (job) => `Congratulations! You have been hired for "${job}".` },
  REJECTED:    { icon: 'close-circle', iconColor: '#b91c1c', iconBg: '#fef2f2', title: 'Application update', body: (job) => `Your application for "${job}" was not selected this time. Keep applying!` },
  APPLIED:     { icon: 'paper-plane', iconColor: colors.primary, iconBg: '#eff6ff', title: 'Application submitted', body: (job) => `Your application for "${job}" has been received.` },
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

function applicationsToNotifications(apps: JobApplication[]): NotiItem[] {
  return apps
    .filter((a) => a.status !== 'APPLIED' || true)
    .map((a) => {
      const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.APPLIED;
      const jobLabel = a.job?.title || a.job?.role || 'a job';
      return {
        id: a.id,
        icon: cfg.icon,
        iconColor: cfg.iconColor,
        iconBg: cfg.iconBg,
        title: cfg.title,
        body: cfg.body(jobLabel),
        time: formatRelative(a.updatedAt || a.createdAt),
      };
    })
    .sort((a, b) => 0);
}

export default function NotificationsScreen() {
  const { token, isWorker } = useAuth();
  const [items, setItems] = useState<NotiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearAllNotifications();

    async function load() {
      if (!token || !isWorker) { setLoading(false); return; }
      try {
        const apps = await listMyApplications(token);
        setItems(applicationsToNotifications(apps));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, isWorker]);

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
          <Text style={styles.emptyBody}>Apply to jobs to receive updates when factories shortlist or hire you.</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.replace('/(tabs)/jobs')}>
            <Text style={styles.browseBtnText}>Browse jobs</Text>
          </Pressable>
        </View>
      ) : (
        <SectionCard title={`${items.length} update${items.length === 1 ? '' : 's'}`}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
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
            </View>
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
            <Text style={styles.body}>You will be alerted when factories shortlist or hire you, and when new matching jobs are posted.</Text>
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
    flexDirection: 'row', gap: 12, paddingVertical: 12,
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
