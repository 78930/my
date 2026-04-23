import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { StatCard } from '../../components/ui/StatCard';
import { Pill } from '../../components/ui/Pill';
import { industrialAreas } from '../../constants/areas';
import { mostDemandingRoles } from '../../constants/roles';
import { colors } from '../../constants/colors';

export default function WelcomeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Sketu</Text>
          <Text style={styles.sub}>Leadership & industrial hiring marketplace</Text>
        </View>
        <View style={styles.cityBadge}>
          <Text style={styles.cityText}>Hyderabad</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Smart hiring for factories</Text>
        <Text style={styles.title}>Area-based hiring for Hyderabad manufacturing clusters.</Text>
        <Text style={styles.description}>
          Workers can create rich profiles with skills, experience, certifications, availability,
          salary preferences and preferred industrial areas. Factories can post jobs, search talent
          and hire faster.
        </Text>

        <View style={styles.pillRow}>
          {mostDemandingRoles.map((role) => (
            <Pill key={role} label={role} />
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="people-outline" value="12k+" label="Verified workers" />
        <StatCard icon="business-outline" value="680+" label="Active factories" />
        <StatCard icon="shield-checkmark-outline" value="54" label="High-match roles" />
      </View>

      <View style={styles.selectWrap}>
        <Text style={styles.selectTitle}>Choose how you want to use Sketu</Text>

        <View style={styles.optionRow}>
          <Pressable
            onPress={() => router.push({ pathname: '/auth/login', params: { type: 'worker' } })}
            style={[styles.choiceCard, styles.choiceOrange]}
          >
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.choiceTitle}>Worker</Text>
            <Text style={styles.choiceText}>Find jobs by area, role, pay and shift.</Text>
            <Text style={styles.choiceAction}>Login as worker</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: '/auth/login', params: { type: 'factory' } })}
            style={[styles.choiceCard, styles.choiceDark]}
          >
            <Ionicons name="business-outline" size={24} color={colors.panel} />
            <Text style={styles.choiceTitle}>Factory</Text>
            <Text style={styles.choiceText}>Search workers, shortlist and hire faster.</Text>
            <Text style={styles.choiceAction}>Login as factory</Text>
          </Pressable>
        </View>

        <View style={styles.buttonsRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push({ pathname: '/auth/signup', params: { type: 'worker' } })}
          >
            <Text style={styles.secondaryButtonText}>Worker sign up</Text>
          </Pressable>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/auth/signup', params: { type: 'factory' } })}
          >
            <Text style={styles.primaryButtonText}>Factory sign up</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.areaWrap}>
        <Text style={styles.areaTitle}>Top industrial areas</Text>
        <View style={styles.pillRow}>
          {industrialAreas.map((area) => (
            <Pill key={area} label={area} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.textInverse, fontSize: 30, fontWeight: '800' },
  sub: { color: colors.textMuted, marginTop: 4 },
  cityBadge: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  cityText: { color: colors.textInverse, fontWeight: '700', fontSize: 12 },
  hero: {
    backgroundColor: colors.panel,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  eyebrow: {
    color: '#fdba74',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  title: { color: colors.textInverse, fontSize: 28, lineHeight: 36, fontWeight: '800' },
  description: { color: '#cbd5e1', marginTop: 12, lineHeight: 22 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  selectWrap: { backgroundColor: colors.card, borderRadius: 28, padding: 16, gap: 12 },
  selectTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  optionRow: { flexDirection: 'row', gap: 12 },
  choiceCard: { flex: 1, borderRadius: 24, padding: 16, borderWidth: 1 },
  choiceOrange: { backgroundColor: colors.primarySoft, borderColor: '#fdba74' },
  choiceDark: { backgroundColor: '#f8fafc', borderColor: colors.border },
  choiceTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 },
  choiceText: { color: colors.textSoft, marginTop: 6, lineHeight: 19, fontSize: 12 },
  choiceAction: { color: colors.primary, marginTop: 12, fontWeight: '700', fontSize: 12 },
  buttonsRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: { color: colors.textInverse, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: { color: colors.textInverse, fontWeight: '800' },
  areaWrap: { backgroundColor: colors.card, borderRadius: 24, padding: 16 },
  areaTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
});
