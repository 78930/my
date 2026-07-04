import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { getJobDetails, updateJob } from '../../services/jobs';
import { ApiError } from '../../lib/api';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';
const SHIFTS = ['Day', 'Night', 'Rotational'];

function Field({
  label, value, onChangeText, placeholder, icon, multiline, keyboardType,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; icon: React.ComponentProps<typeof Ionicons>['name'];
  multiline?: boolean; keyboardType?: 'default' | 'numeric';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5, borderColor: focused ? BRAND_BLUE : '#E2E8F0', paddingHorizontal: 14, gap: 10, minHeight: multiline ? 100 : 50 }}>
        <Ionicons name={icon} size={18} color={focused ? BRAND_BLUE : '#94A3B8'} style={{ marginTop: multiline ? 14 : 0 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          keyboardType={keyboardType ?? 'default'}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={{ flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#0F172A', paddingVertical: multiline ? 14 : 0 }}
        />
      </View>
    </View>
  );
}

function ShiftChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: active ? BRAND_BLUE : WHITE, borderWidth: 1.5, borderColor: active ? BRAND_BLUE : '#E2E8F0' }}
    >
      <Text style={{ color: active ? WHITE : '#475569', fontSize: 13, fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium' }}>{label}</Text>
    </Pressable>
  );
}

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isFactory } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [shift, setShift] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [payMin, setPayMin] = useState('');
  const [payMax, setPayMax] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) { setLoadError('Job ID missing.'); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getJobDetails(id)
      .then((job) => {
        if (cancelled) return;
        setTitle(job.title || job.role || '');
        setArea(job.area || '');
        setShift(job.shift || '');
        setDescription(job.description || '');
        setSkills((job.skillsRequired || job.skills || []).join(', '));
        setPayMin(job.payMin ? String(job.payMin) : '');
        setPayMax(job.payMax ? String(job.payMax) : '');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Unable to load job details');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function handleSave() {
    if (!token || !isFactory || !id) return;
    if (!title.trim()) { setMessage('Job title is required.'); return; }
    if (!area.trim()) { setMessage('Industrial area is required.'); return; }
    if (!shift.trim()) { setMessage('Shift is required.'); return; }
    if (description.trim().length < 10) { setMessage('Description must be at least 10 characters.'); return; }

    setSaving(true);
    setMessage('');
    try {
      await updateJob(token, id, {
        title: title.trim(), description: description.trim(), area: area.trim(), shift: shift.trim(),
        skillsRequired: skills.split(',').map((s) => s.trim()).filter(Boolean),
        payMin: Number(payMin || 0),
        payMax: Number(payMax || 0),
      });
      setMessage('Job updated successfully.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to update job.');
    } finally {
      setSaving(false);
    }
  }

  const isSuccess = message.includes('successfully');
  const isWarning = message.includes('required') || message.includes('must');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>

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
                  <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Edit Job</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Changes go live immediately</Text>
                </View>
              </View>
            </View>

            {/* ── White body ── */}
            <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 16 }}>

              {loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                  <ActivityIndicator size="large" color={BRAND_BLUE} />
                  <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading job details…</Text>
                </View>
              ) : loadError ? (
                <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
                  <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
                  <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Unable to load</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' }}>{loadError}</Text>
                </View>
              ) : (
                <>
                  <Field label="Job Title" value={title} onChangeText={setTitle} placeholder="e.g. Production Supervisor" icon="briefcase-outline" />
                  <Field label="Industrial Area" value={area} onChangeText={setArea} placeholder="e.g. Jeedimetla" icon="location-outline" />

                  <View style={{ gap: 8 }}>
                    <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>Shift</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {SHIFTS.map((s) => (
                        <ShiftChip key={s} label={s} active={shift === s} onPress={() => setShift(shift === s ? '' : s)} />
                      ))}
                    </ScrollView>
                  </View>

                  <Field label="Job Description" value={description} onChangeText={setDescription} placeholder="Describe the role, responsibilities and requirements" icon="document-text-outline" multiline />
                  <Field label="Skills Required (comma separated)" value={skills} onChangeText={setSkills} placeholder="e.g. Welding, CNC, Quality control" icon="build-outline" />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Min Pay (₹)" value={payMin} onChangeText={setPayMin} placeholder="15000" icon="cash-outline" keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Max Pay (₹)" value={payMax} onChangeText={setPayMax} placeholder="25000" icon="cash-outline" keyboardType="numeric" />
                    </View>
                  </View>

                  {message ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: isSuccess ? '#F0FDF4' : isWarning ? '#FFF7ED' : '#FEF2F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isSuccess ? '#BBF7D0' : isWarning ? '#FED7AA' : '#FECACA' }}>
                      <Ionicons name={isSuccess ? 'checkmark-circle' : 'alert-circle'} size={18} color={isSuccess ? '#22C55E' : isWarning ? ORANGE : '#EF4444'} />
                      <Text style={{ flex: 1, color: isSuccess ? '#15803D' : isWarning ? '#92400E' : '#B91C1C', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{message}</Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      onPress={() => { Haptics.selectionAsync(); router.back(); }}
                      style={{ flex: 1, height: 54, backgroundColor: '#F1F5F9', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: '#475569', fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Discard</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSave(); }}
                      disabled={saving}
                      style={{ flex: 2, height: 54, backgroundColor: saving ? '#93A5E8' : BRAND_BLUE, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                    >
                      {saving ? <ActivityIndicator size="small" color={WHITE} /> : <Ionicons name="save-outline" size={20} color={WHITE} />}
                      <Text style={{ color: WHITE, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>{saving ? 'Saving…' : 'Save Changes'}</Text>
                    </Pressable>
                  </View>
                </>
              )}

              <View style={{ height: 16 }} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
