import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { WorkerProfile } from '../../types';

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
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

export default function HomeTab() {
  const { user, signOut, profile, isWorker } = useAuth();
  const workerProfile = isWorker ? (profile as WorkerProfile | null) : null;
  const { pct, missing } = profileCompleteness(workerProfile);

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Sketu</Text>
          <Text style={styles.sub}>
            {user ? `Welcome, ${user.name}` : 'Leadership & industrial hiring marketplace'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => router.push('/notifications' as never)}>
            <Ionicons name="notifications-outline" size={20} color={colors.textInverse} />
          </Pressable>
          <Pressable
            style={styles.logoutButton}
            onPress={async () => {
              await signOut();
              router.replace('/auth/welcome');
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Open-to-work status + profile completeness — worker only */}
      {isWorker ? (
        <Pressable style={styles.statusCard} onPress={() => router.push('/(tabs)/profile')}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: workerProfile?.isOpenToWork !== false ? '#16a34a' : '#94a3b8' }]} />
            <Text style={styles.statusLabel}>
              {workerProfile?.isOpenToWork !== false ? 'Open to work' : 'Not looking right now'}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.statusPct}>{pct}% profile</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          {missing.length > 0 && pct < 100 ? (
            <Text style={styles.missingText}>Add: {missing.slice(0, 3).join(' · ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}</Text>
          ) : null}
        </Pressable>
      ) : null}

      {/* Quick actions */}
      <SectionCard title="Quick actions">
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/jobs')}>
            <Ionicons name="search-outline" size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>Browse jobs</Text>
            <Text style={styles.quickText}>Search live openings by area, role, shift and salary.</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/resume')}>
            <Ionicons name="document-attach-outline" size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>Resume builder</Text>
            <Text style={styles.quickText}>Build your resume or upload a PDF to share with factories.</Text>
          </Pressable>
        </View>

        {isWorker ? (
          <View style={styles.quickGrid}>
            <Pressable style={styles.quickCard} onPress={() => router.push('/worker/applications')}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              <Text style={styles.quickTitle}>Application history</Text>
              <Text style={styles.quickText}>Track applied, shortlisted and hired jobs.</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/worker/saved')}>
              <Ionicons name="bookmark-outline" size={22} color={colors.primary} />
              <Text style={styles.quickTitle}>Saved jobs</Text>
              <Text style={styles.quickText}>Keep promising roles and revisit them later.</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable style={styles.profileCard} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>Edit profile</Text>
            <Text style={styles.quickText}>Update worker details, areas, skills, and availability.</Text>
          </View>
        </Pressable>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.textInverse, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.textMuted, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },
  statusPct: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  missingText: { color: colors.textMuted, fontSize: 12 },
  quickGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  quickCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 22, padding: 16 },
  profileCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  quickTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 },
  quickText: { color: colors.textSoft, marginTop: 6, lineHeight: 19, fontSize: 12 },
});
