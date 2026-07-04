import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../components/ui/Text';
import { useAuth } from '../../../context/AuthContext';
import { ApiError } from '../../../lib/api';
import { JobApplication } from '../../../types';
import { listMyApplications } from '../../../services/applications';

const BRAND_BLUE = '#1240C7';
const WHITE = '#FFFFFF';

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DetailRow({ icon, label, value, highlight = false }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <Ionicons name={icon} size={15} color={highlight ? '#22C55E' : '#94A3B8'} />
      <Text style={{ flex: 1, color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>{label}</Text>
      <Text style={{ color: highlight ? '#22C55E' : '#0F172A', fontSize: highlight ? 16 : 14, fontFamily: 'PlusJakartaSans_700Bold' }}>{value}</Text>
    </View>
  );
}

export default function HireOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isWorker } = useAuth();

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token || !isWorker || !id) { setLoading(false); setError('Unable to load hire offer.'); return; }
      setLoading(true); setError('');
      try {
        const items = await listMyApplications(token);
        const found = items.find((a) => a.id === id);
        if (!cancelled) {
          if (found) setApplication(found);
          else setError('Hire offer not found.');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load hire offer');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, isWorker, id]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Hire Offer</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>
                  {application?.job?.role ? `For ${application.job.role}` : 'Your job offer details'}
                </Text>
              </View>
              <View style={{ backgroundColor: '#34D399', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: WHITE, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' }}>Hired!</Text>
              </View>
            </View>
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 16 }}>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Fetching your hire offer…</Text>
              </View>
            ) : error ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
                <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Unable to load</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>{error}</Text>
              </View>
            ) : application ? (
              <>
                {/* Congratulations banner */}
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1.5, borderColor: '#BBF7D0' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ionicons name="checkmark-circle" size={30} color={WHITE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#15803D', fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>Congratulations!</Text>
                    <Text style={{ color: '#166534', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 4, lineHeight: 20 }}>
                      You have been hired for{' '}
                      <Text style={{ color: '#15803D', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        {application.job?.role || 'this role'}
                      </Text>
                      {application.job?.company ? ` at ${application.job.company}` : ''}.
                    </Text>
                  </View>
                </View>

                {/* Offer details */}
                {(application.proposedPay != null || application.joiningDate) ? (
                  <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 2, borderWidth: 1, borderColor: '#BBF7D0' }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>Offer Details</Text>
                    {application.proposedPay != null ? (
                      <DetailRow icon="cash-outline" label="Proposed pay" value={`₹${application.proposedPay.toLocaleString('en-IN')}`} highlight />
                    ) : null}
                    {application.joiningDate ? (
                      <DetailRow icon="calendar-outline" label="Joining date" value={formatDate(application.joiningDate)} highlight />
                    ) : null}
                  </View>
                ) : null}

                {/* Job details */}
                <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 2, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>Job Details</Text>
                  <DetailRow icon="briefcase-outline" label="Role" value={application.job?.role || '—'} />
                  <DetailRow icon="business-outline" label="Company" value={application.job?.company || '—'} />
                  <DetailRow icon="location-outline" label="Area" value={application.job?.area || '—'} />
                  <DetailRow icon="time-outline" label="Shift" value={application.job?.shift || '—'} />
                  <DetailRow icon="cash-outline" label="Pay range" value={application.job?.pay || 'Negotiable'} />
                  <DetailRow icon="layers-outline" label="Employment" value={application.job?.employmentType || 'Full-time'} />
                </View>

                {/* Application details */}
                <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 2, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>Your Application</Text>
                  <DetailRow icon="calendar-outline" label="Applied on" value={formatDate(application.createdAt)} />
                  <DetailRow icon="refresh-outline" label="Updated" value={formatDate(application.updatedAt)} />
                  {application.note ? (
                    <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#EBF0FF', borderRadius: 12, padding: 12, marginTop: 8 }}>
                      <Ionicons name="chatbox-ellipses-outline" size={14} color={BRAND_BLUE} style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, color: '#1E40AF', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 18 }}>{application.note}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Next steps */}
                <View style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Next Steps</Text>

                  {application.factoryPhone ? (
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`tel:${application.factoryPhone}`); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F0FDF4', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' }}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="call" size={20} color={WHITE} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#166534', fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>Call factory HR</Text>
                        <Text style={{ color: '#15803D', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 2 }}>{application.factoryPhone}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#22C55E" />
                    </Pressable>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: BRAND_BLUE, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="call-outline" size={18} color={WHITE} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Contact the factory</Text>
                        <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 3, lineHeight: 18 }}>
                          Reach out to HR to confirm your joining date, proposed pay, and onboarding details.
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: BRAND_BLUE, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="document-text-outline" size={18} color={WHITE} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Keep documents ready</Text>
                      <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 3, lineHeight: 18 }}>
                        Prepare your Aadhaar, PAN card, bank passbook, and certifications for onboarding.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* View job button */}
                {application.jobId ? (
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); router.push(`/jobs/${application.jobId}` as never); }}
                    style={{ height: 52, backgroundColor: '#F1F5F9', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    <Ionicons name="open-outline" size={18} color="#475569" />
                    <Text style={{ color: '#475569', fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>View Job Details</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}

            <View style={{ height: 16 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
