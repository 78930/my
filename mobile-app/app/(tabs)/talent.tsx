import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { InputField } from '../../components/ui/InputField';
import { Pill } from '../../components/ui/Pill';
import { industrialAreas } from '../../constants/areas';
import { mostDemandingRoles } from '../../constants/roles';
import { WorkerCard } from '../../components/talent/WorkerCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors } from '../../constants/colors';
import { searchWorkers } from '../../services/workers';
import { ApiError } from '../../lib/api';
import { workerCache } from '../../lib/workerCache';
import { Worker } from '../../types';

const SHIFTS = ['Any', 'Day', 'Night', 'Rotational'];

export default function TalentTab() {
  const [area, setArea] = useState('Jeedimetla');
  const [role, setRole] = useState('Production Supervisor');
  const [shift, setShift] = useState('Any');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await searchWorkers({
          area,
          role,
          shift: shift === 'Any' ? undefined : shift,
          q: search || undefined,
        });
        if (!cancelled) {
          workerCache.setAll(data);
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof ApiError ? err.message : 'Unable to load worker profiles';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [area, role, shift, search]);

  return (
    <Screen>
      <SectionCard title="Talent" subtitle={`${items.length} profile${items.length === 1 ? '' : 's'} found`}>
        <InputField
          icon="search-outline"
          placeholder="Search workers, PLC, CNC, QA..."
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.label}>Industrial area</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {industrialAreas.map((item) => (
            <Pill key={item} label={item} active={area === item} onPress={() => setArea(item)} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Priority roles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {mostDemandingRoles.map((item) => (
            <Pill key={item} label={item} active={role === item} onPress={() => setRole(item)} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Shift</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {SHIFTS.map((item) => (
            <Pill key={item} label={item} active={shift === item} onPress={() => setShift(item)} />
          ))}
        </ScrollView>
      </SectionCard>

      {loading ? <EmptyState icon="hourglass-outline" title="Loading workers" message="Fetching live worker profiles…" /> : null}
      {!loading && error ? <EmptyState icon="cloud-offline-outline" title="Unable to load profiles" message={error} /> : null}
      {!loading && !error && !items.length ? (
        <EmptyState icon="people-outline" title="No profiles found" message="Try another area, role or search term." />
      ) : null}
      {!loading && !error
        ? items.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onPress={() => router.push(`/worker/${worker.id}` as never)}
            />
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontWeight: '700' },
  row: { gap: 8 },
});
