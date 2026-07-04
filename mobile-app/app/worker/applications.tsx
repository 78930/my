import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { ApplicationHistoryCard } from '../../components/worker/ApplicationHistoryCard';
import { useAuth } from '../../context/AuthContext';
import { listMyApplications } from '../../services/applications';
import { ApiError } from '../../lib/api';
import { JobApplication } from '../../types';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

export default function WorkerApplicationsScreen() {
  const { token, isWorker } = useAuth();
  const [items, setItems] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token || !isWorker) { setLoading(false); setError('Log in as a job seeker to view application history.'); return; }
      setLoading(true); setError('');
      try {
        const data = await listMyApplications(token);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load applications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, isWorker]);

  const applied = items.filter((i) => i.status === 'APPLIED').length;
  const shortlisted = items.filter((i) => i.status === 'SHORTLISTED').length;
  const hired = items.filter((i) => i.status === 'HIRED').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Blue header ── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: !loading && items.length > 0 ? 20 : 0 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.back(); }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back-outline" size={20} color={WHITE} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>My Applications</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>
                  {loading ? 'Loading…' : `${items.length} application${items.length === 1 ? '' : 's'}`}
                </Text>
              </View>
            </View>

            {/* Stats row */}
            {!loading && items.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(147,197,253,0.20)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: '#93C5FD', fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{applied}</Text>
                  <Text style={{ color: '#93C5FD', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Applied</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'rgba(255,140,0,0.20)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: ORANGE, fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{shortlisted}</Text>
                  <Text style={{ color: ORANGE, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Shortlisted</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'rgba(52,211,153,0.20)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: '#34D399', fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{hired}</Text>
                  <Text style={{ color: '#34D399', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>Hired</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 12 }}>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Fetching your applications…</Text>
              </View>
            ) : error ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
                <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Unable to load</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>{error}</Text>
              </View>
            ) : !items.length ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 14 }}>
                <Ionicons name="document-text-outline" size={44} color="#94A3B8" />
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>No applications yet</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>Browse jobs and apply to see your history here.</Text>
                </View>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/jobs' as never); }}
                  style={{ height: 50, backgroundColor: BRAND_BLUE, borderRadius: 16, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: WHITE, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Browse Jobs</Text>
                </Pressable>
              </View>
            ) : (
              items.map((item) => (
                <ApplicationHistoryCard
                  key={item.id}
                  item={item}
                  onOpenJob={item.jobId ? () => router.push(`/jobs/${item.jobId}` as never) : undefined}
                  onViewOffer={item.status === 'HIRED' ? () => router.push(`/worker/hire/${item.id}` as never) : undefined}
                />
              ))
            )}

            <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
