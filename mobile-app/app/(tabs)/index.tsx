import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { StatCard } from '../../components/ui/StatCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { industrialAreas } from '../../constants/areas';
import { mostDemandingRoles } from '../../constants/roles';
import { Pill } from '../../components/ui/Pill';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../lib/api';

export default function HomeTab() {
  const { user, signOut, profile, isWorker } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Sketu</Text>
          <Text style={styles.sub}>
            {user ? `Welcome, ${user.name}` : 'Leadership & industrial hiring marketplace'}
          </Text>
        </View>
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

      

      <View style={styles.statsRow}>
        <StatCard icon="people-outline" value={user?.type === 'worker' ? 'Worker' : 'Factory'} label="Account type" />
        <StatCard icon="business-outline" value={profile ? 'Connected' : 'Pending'} label="Profile sync" />
        <StatCard icon="cloud-outline" value={getApiBaseUrl() ? 'Online' : 'Missing URL'} label="API status" />
      </View>


      <SectionCard title="Target industrial areas" subtitle="Cluster-based discovery across Hyderabad">
        <View style={styles.pillsWrap}>
          {industrialAreas.map((area) => (
            <Pill key={area} label={area} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Quick actions">
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/jobs')}>
            <Ionicons name="search-outline" size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>Browse jobs</Text>
            <Text style={styles.quickText}>Search live openings by area, role, shift and salary.</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/talent')}>
            <Ionicons name="people-outline" size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>View talent</Text>
            <Text style={styles.quickText}>Search live worker profiles from the backend.</Text>
          </Pressable>
        </View>

        {isWorker ? (
          <View style={styles.quickGridExtra}>
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
            <Text style={styles.quickText}>Update worker or factory details, areas, skills, and availability.</Text>
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
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: colors.panel,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  eyebrow: {
    color: '#fdba74',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 10,
  },
  title: { color: colors.textInverse, fontSize: 28, lineHeight: 36, fontWeight: '800' },
  description: { color: '#cbd5e1', marginTop: 12, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10 },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickGridExtra: { flexDirection: 'row', gap: 12, marginTop: 12 },
  quickCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 22, padding: 16 },
  profileCard: {
    marginTop: 12,
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
