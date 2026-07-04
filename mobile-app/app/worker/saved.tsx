import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { JobCard } from '../../components/jobs/JobCard';
import { listSavedJobs, unsaveJob } from '../../services/savedJobs';
import { SavedJob } from '../../types';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

export default function SavedJobsScreen() {
  const [items, setItems] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await listSavedJobs();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleUnsave(jobId: string) {
    await unsaveJob(jobId);
    setItems((prev) => prev.filter((item) => item.jobId !== jobId));
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Blue header ── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.back(); }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back-outline" size={20} color={WHITE} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Saved Jobs</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>
                  {loading ? 'Loading…' : `${items.length} saved job${items.length === 1 ? '' : 's'} on this device`}
                </Text>
              </View>
              {items.length > 0 ? (
                <View style={{ backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={{ color: WHITE, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>{items.length}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 12 }}>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Fetching saved jobs…</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 14 }}>
                <Ionicons name="bookmark-outline" size={44} color="#94A3B8" />
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>No saved jobs</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>
                    Save a job from the Jobs list or Job details screen to see it here.
                  </Text>
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
                <JobCard
                  key={item.jobId}
                  job={item.job}
                  onView={() => router.push(`/jobs/${item.jobId}` as never)}
                  onSave={() => handleUnsave(item.jobId)}
                  isSaved
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
