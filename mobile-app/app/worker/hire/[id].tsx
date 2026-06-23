import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../components/ui/Screen';
import { SectionCard } from '../../../components/ui/SectionCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { ApiError } from '../../../lib/api';
import { JobApplication } from '../../../types';
import { listMyApplications } from '../../../services/applications';

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
      if (!token || !isWorker || !id) {
        setLoading(false);
        setError('Unable to load hire offer.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const items = await listMyApplications(token);
        const found = items.find((a) => a.id === id);
        if (!cancelled) {
          if (found) {
            setApplication(found);
          } else {
            setError('Hire offer not found.');
          }
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
    <Screen>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>Hire offer</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <EmptyState icon="hourglass-outline" title="Loading" message="Fetching your hire offer…" />
      ) : error ? (
        <EmptyState icon="cloud-offline-outline" title="Unable to load" message={error} />
      ) : application ? (
        <>
          {/* Congratulations banner */}
          <View style={styles.congrats}>
            <Ionicons name="checkmark-circle" size={36} color="#16a34a" />
            <View style={{ flex: 1 }}>
              <Text style={styles.congratsTitle}>Congratulations!</Text>
              <Text style={styles.congratsBody}>
                You have been hired for{' '}
                <Text style={styles.congratsBold}>{application.job?.role || 'this role'}</Text>
                {application.job?.company ? ` at ${application.job.company}` : ''}.
              </Text>
            </View>
          </View>

          {/* Hire offer details — shown when factory has set proposed pay */}
          {(application.proposedPay != null || application.joiningDate) ? (
            <SectionCard title="Offer details">
              {application.proposedPay != null && (
                <DetailRow
                  icon="cash-outline"
                  label="Proposed pay"
                  value={`₹${application.proposedPay.toLocaleString('en-IN')}`}
                  highlight
                />
              )}
              {application.joiningDate && (
                <DetailRow
                  icon="calendar-outline"
                  label="Joining date"
                  value={formatDate(application.joiningDate)}
                  highlight
                />
              )}
            </SectionCard>
          ) : null}

          {/* Job details */}
          <SectionCard title="Job details">
            <DetailRow icon="briefcase-outline" label="Role" value={application.job?.role || '—'} />
            <DetailRow icon="business-outline" label="Company" value={application.job?.company || '—'} />
            <DetailRow icon="location-outline" label="Area" value={application.job?.area || '—'} />
            <DetailRow icon="time-outline" label="Shift" value={application.job?.shift || '—'} />
            <DetailRow icon="cash-outline" label="Pay range" value={application.job?.pay || 'Negotiable'} />
            <DetailRow icon="layers-outline" label="Employment" value={application.job?.employmentType || 'Full-time'} />
          </SectionCard>

          {/* Application details */}
          <SectionCard title="Your application">
            <DetailRow icon="calendar-outline" label="Applied on" value={formatDate(application.createdAt)} />
            <DetailRow icon="refresh-outline" label="Updated" value={formatDate(application.updatedAt)} />
            {application.note ? (
              <View style={styles.noteBox}>
                <Ionicons name="chatbox-ellipses-outline" size={14} color="#1d4ed8" />
                <Text style={styles.noteText}>{application.note}</Text>
              </View>
            ) : null}
          </SectionCard>

          {/* Next steps */}
          <SectionCard title="Next steps">
            {application.factoryPhone ? (
              <Pressable
                style={styles.callFactory}
                onPress={() => Linking.openURL(`tel:${application.factoryPhone}`)}
              >
                <View style={styles.stepIcon}>
                  <Ionicons name="call" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.callFactoryLabel}>Call factory HR</Text>
                  <Text style={styles.callFactoryNumber}>{application.factoryPhone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#15803d" />
              </Pressable>
            ) : (
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Contact the factory</Text>
                  <Text style={styles.stepBody}>
                    Reach out to the factory HR to confirm your joining date, proposed pay, and other onboarding details.
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Keep documents ready</Text>
                <Text style={styles.stepBody}>
                  Prepare your Aadhaar, PAN card, bank passbook, and any certifications for onboarding.
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* Go to job */}
          {application.jobId ? (
            <Pressable
              style={styles.viewJobBtn}
              onPress={() => router.push(`/jobs/${application.jobId}` as never)}
            >
              <Ionicons name="open-outline" size={16} color={colors.textInverse} />
              <Text style={styles.viewJobBtnText}>View job details</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={15} color={highlight ? '#15803d' : colors.textMuted} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { color: colors.textInverse, fontSize: 20, fontWeight: '800' },
  iconBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  congrats: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#f0fdf4', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  congratsTitle: { color: '#15803d', fontWeight: '800', fontSize: 17, marginBottom: 4 },
  congratsBody: { color: '#166534', lineHeight: 20, fontSize: 14 },
  congratsBold: { fontWeight: '800' },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  detailIconWrap: { width: 28, alignItems: 'center' },
  detailLabel: { color: colors.textSoft, fontSize: 13, fontWeight: '600', flex: 1 },
  detailValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  detailValueHighlight: { color: '#15803d', fontSize: 16 },
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginTop: 6,
  },
  noteText: { color: '#1d4ed8', lineHeight: 18, flex: 1, fontSize: 13 },
  stepRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  stepIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: { color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 3 },
  stepBody: { color: colors.textSoft, fontSize: 13, lineHeight: 18 },
  callFactory: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f0fdf4', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 4,
  },
  callFactoryLabel: { color: '#15803d', fontSize: 11, fontWeight: '700', marginBottom: 2 },
  callFactoryNumber: { color: '#14532d', fontWeight: '800', fontSize: 18 },
  viewJobBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.panel, borderRadius: 16, paddingVertical: 14,
  },
  viewJobBtnText: { color: colors.textInverse, fontWeight: '800', fontSize: 15 },
});
