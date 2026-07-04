import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { industrialAreas } from '../../constants/areas';
import { mostDemandingRoles } from '../../constants/roles';
import { WorkerCard } from '../../components/talent/WorkerCard';
import { calculateMatchScore } from '../../utils/match';
import { searchWorkers } from '../../services/workers';
import { ApiError } from '../../lib/api';
import { workerCache } from '../../lib/workerCache';
import { Worker } from '../../types';

const BRAND_BLUE = '#1240C7';
const WHITE = '#FFFFFF';
const SHIFTS = ['Any', 'Day', 'Night', 'Rotational'];

type QueryState = { area: string; role: string; shift: string; search: string; page: number };

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: active ? BRAND_BLUE : WHITE, borderWidth: 1.5, borderColor: active ? BRAND_BLUE : '#E2E8F0' }}
    >
      <Text style={{ color: active ? WHITE : '#475569', fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export default function TalentTab() {
  const [queryState, setQueryState] = useState<QueryState>({ area: 'Jeedimetla', role: 'Production Supervisor', shift: 'Any', search: '', page: 1 });
  const { area, role, shift, search, page } = queryState;

  const [items, setItems] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (page === 1) { setLoading(true); setError(''); } else { setLoadingMore(true); }
    async function load() {
      try {
        const { items: newItems, pagination } = await searchWorkers({ area, role, shift: shift === 'Any' ? undefined : shift, q: search || undefined, page });
        if (!cancelled) {
          if (page === 1) { workerCache.setAll(newItems); setItems(newItems); }
          else { workerCache.setAll(newItems); setItems((prev) => [...prev, ...newItems]); }
          setHasMore(pagination?.hasMore ?? false);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load job seeker profiles');
      } finally {
        if (!cancelled) { setLoading(false); setLoadingMore(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [queryState]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Header ────────────────────────────────────────── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Find Talent</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>
                  {`${items.length} profile${items.length === 1 ? '' : 's'} found`}
                </Text>
              </View>
              <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/notifications' as never); }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications-outline" size={20} color={WHITE} />
              </Pressable>
            </View>
            {/* Search bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: searchFocused ? WHITE : 'rgba(255,255,255,0.92)', borderRadius: 14, paddingHorizontal: 14, height: 48, gap: 10, borderWidth: 2, borderColor: searchFocused ? WHITE : 'transparent' }}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" />
              <TextInput
                value={search}
                onChangeText={(v) => setQueryState((q) => ({ ...q, search: v, page: 1 }))}
                placeholder="Search job seekers, PLC, CNC, QA…"
                placeholderTextColor="#94A3B8"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{ flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#1E293B', paddingVertical: 0 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setQueryState((q) => ({ ...q, search: '', page: 1 }))}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>
          </View>

          {/* ── Filters + results ──────────────────────────────── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, paddingTop: 20, gap: 14 }}>

            <View style={{ gap: 10, paddingHorizontal: 20 }}>
              <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3, textTransform: 'uppercase' }}>Industrial Area</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {industrialAreas.map((item) => (
                  <FilterChip key={item} label={item} active={area === item} onPress={() => setQueryState((q) => ({ ...q, area: item, page: 1 }))} />
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: 10, paddingHorizontal: 20 }}>
              <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3, textTransform: 'uppercase' }}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {mostDemandingRoles.map((item) => (
                  <FilterChip key={item} label={item} active={role === item} onPress={() => setQueryState((q) => ({ ...q, role: item, page: 1 }))} />
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: 10, paddingHorizontal: 20 }}>
              <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3, textTransform: 'uppercase' }}>Shift</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {SHIFTS.map((item) => (
                  <FilterChip key={item} label={item} active={shift === item} onPress={() => setQueryState((q) => ({ ...q, shift: item, page: 1 }))} />
                ))}
              </ScrollView>
            </View>

            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                  <ActivityIndicator size="large" color={BRAND_BLUE} />
                  <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading profiles…</Text>
                </View>
              ) : error ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
                  <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                  <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Unable to load profiles</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular' }}>{error}</Text>
                </View>
              ) : !items.length ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
                  <Ionicons name="people-outline" size={44} color="#94A3B8" />
                  <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>No profiles found</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>Try another area, role or search term.</Text>
                </View>
              ) : (
                items.map((worker) => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    matchScore={calculateMatchScore([role], worker.skills)}
                    onPress={() => router.push(`/worker/${worker.id}` as never)}
                  />
                ))
              )}

              {!loading && !error && hasMore && !loadingMore ? (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setQueryState((q) => ({ ...q, page: q.page + 1 })); }}
                  style={{ height: 48, backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5, borderColor: BRAND_BLUE, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: BRAND_BLUE, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>Load more</Text>
                </Pressable>
              ) : null}

              {loadingMore ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={BRAND_BLUE} />
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading more…</Text>
                </View>
              ) : null}
            </View>

            <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
