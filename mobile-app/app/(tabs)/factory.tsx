import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { FactoryDashboardSummary } from '../../types';
import { getFactoryDashboard } from '../../services/factory';

const initialSummary: FactoryDashboardSummary = {
  openJobs: 0,
  totalApplications: 0,
  shortlisted: 0,
  hires: 0,
};

export default function FactoryTab() {
  const { user, token, isFactory, signOut } = useAuth();
  const [summary, setSummary] = useState<FactoryDashboardSummary>(initialSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token || !isFactory) { setLoading(false); return; }
      setLoading(true);
      try {
        const data = await getFactoryDashboard(token);
        if (!cancelled) setSummary(data);
      } catch {
        // non-critical, show zeros
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, isFactory]);

  const val = (n: number) => (loading ? '…' : String(n));

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Sketu</Text>
          <Text style={styles.sub}>
            {user ? `Welcome, ${user.name}` : 'Factory hiring dashboard'}
          </Text>
        </View>
        <Pressable
          style={styles.logoutBtn}
          onPress={async () => { await signOut(); router.replace('/auth/welcome'); }}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.textInverse} />
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatChip icon="briefcase-outline" label="Open jobs" value={val(summary.openJobs)} color="#3b82f6" bg="#eff6ff" />
        <StatChip icon="people-outline" label="Applied" value={val(summary.totalApplications)} color="#8b5cf6" bg="#f5f3ff" />
        <StatChip icon="star-outline" label="Shortlisted" value={val(summary.shortlisted)} color="#f59e0b" bg="#fffbeb" />
        <StatChip icon="checkmark-circle-outline" label="Hired" value={val(summary.hires)} color="#16a34a" bg="#f0fdf4" />
      </View>

      {/* First-time nudge */}
      {!loading && summary.openJobs === 0 ? (
        <Pressable style={styles.nudgeCard} onPress={() => router.push('/factory/post-job')}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nudgeTitle}>Post your first job</Text>
            <Text style={styles.nudgeText}>You have no open jobs yet. Tap here to create your first opening and start receiving applications.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}

      {/* Quick actions */}
      <SectionCard title="Quick actions">
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/factory/post-job')}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>Post a job</Text>
            <Text style={styles.quickText}>Create a new opening with role, area, shift and pay details.</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/factory/pipeline')}>
            <Ionicons name="git-network-outline" size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>Candidate pipeline</Text>
            <Text style={styles.quickText}>Move applicants from applied to shortlisted to hired.</Text>
          </Pressable>
        </View>

        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/factory/my-jobs' as never)}>
            <Ionicons name="list-outline" size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>My jobs</Text>
            <Text style={styles.quickText}>View, close or reopen your posted job openings.</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/talent')}>
            <Ionicons name="search-outline" size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>Search talent</Text>
            <Text style={styles.quickText}>Browse live worker profiles by area and role.</Text>
          </Pressable>
        </View>

        <Pressable style={styles.profileCard} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="business-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>Company profile</Text>
            <Text style={styles.quickText}>Update factory details, location and contact info.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.pipelineCard} onPress={() => router.push('/factory/pipeline')}>
          <Ionicons name="layers-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>Open candidate pipeline</Text>
            <Text style={styles.quickText}>See all applications across your open jobs in one view.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </SectionCard>
    </Screen>
  );
}

function StatChip({ icon, label, value, color, bg }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[chip.wrap, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[chip.value, { color }]}>{value}</Text>
      <Text style={chip.label}>{label}</Text>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { color: colors.textSoft, fontSize: 10, fontWeight: '600', textAlign: 'center' },
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.textInverse, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.textMuted, marginTop: 4 },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  quickGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  quickCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 22, padding: 16 },
  quickTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 },
  quickText: { color: colors.textSoft, marginTop: 6, lineHeight: 19, fontSize: 12 },
  pipelineCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  nudgeCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  nudgeTitle: { color: colors.text, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  nudgeText: { color: colors.textSoft, fontSize: 12, lineHeight: 18 },
});
