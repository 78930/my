import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

type QueryState = { area: string; role: string; shift: string; search: string; page: number };

export default function TalentTab() {
  const [queryState, setQueryState] = useState<QueryState>({
    area: 'Jeedimetla',
    role: 'Production Supervisor',
    shift: 'Any',
    search: '',
    page: 1,
  });
  const { area, role, shift, search, page } = queryState;

  const [items, setItems] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (page === 1) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    async function load() {
      try {
        const { items: newItems, pagination } = await searchWorkers({
          area,
          role,
          shift: shift === 'Any' ? undefined : shift,
          q: search || undefined,
          page,
        });
        if (!cancelled) {
          if (page === 1) {
            workerCache.setAll(newItems);
            setItems(newItems);
          } else {
            workerCache.setAll(newItems);
            setItems((prev) => [...prev, ...newItems]);
          }
          setHasMore(pagination?.hasMore ?? false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Unable to load worker profiles');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [queryState]);

  return (
    <Screen>
      <SectionCard title="Talent" subtitle={`${items.length} profile${items.length === 1 ? '' : 's'} found`}>
        <InputField
          icon="search-outline"
          placeholder="Search workers, PLC, CNC, QA..."
          value={search}
          onChangeText={(val) => setQueryState((q) => ({ ...q, search: val, page: 1 }))}
        />

        <Text style={styles.label}>Industrial area</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {industrialAreas.map((item) => (
            <Pill key={item} label={item} active={area === item} onPress={() => setQueryState((q) => ({ ...q, area: item, page: 1 }))} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Priority roles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {mostDemandingRoles.map((item) => (
            <Pill key={item} label={item} active={role === item} onPress={() => setQueryState((q) => ({ ...q, role: item, page: 1 }))} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Shift</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {SHIFTS.map((item) => (
            <Pill key={item} label={item} active={shift === item} onPress={() => setQueryState((q) => ({ ...q, shift: item, page: 1 }))} />
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

      {!loading && !error && hasMore ? (
        <Pressable
          style={styles.loadMoreBtn}
          onPress={() => setQueryState((q) => ({ ...q, page: q.page + 1 }))}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreText}>Load more workers</Text>
        </Pressable>
      ) : null}
      {loadingMore ? (
        <View style={styles.loadingMoreRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingMoreText}>Loading more…</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontWeight: '700' },
  row: { gap: 8 },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  loadMoreText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  loadingMoreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, marginBottom: 8,
  },
  loadingMoreText: { color: colors.textMuted, fontSize: 14 },
});
