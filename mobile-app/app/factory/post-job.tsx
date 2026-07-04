import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { createJob } from '../../services/jobs';
import { ApiError } from '../../lib/api';
import { industrialAreas } from '../../constants/areas';

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

export default function PostJobScreen() {
  const { token, isFactory } = useAuth();
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [shift, setShift] = useState('');
  const [skills, setSkills] = useState('');
  const [description, setDescription] = useState('');
  const [payMin, setPayMin] = useState('');
  const [payMax, setPayMax] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  async function handleCreate() {
    if (!token || !isFactory) { setMessage('Log in as a factory account to post jobs.'); return; }
    if (!title.trim()) { setMessage('Job title is required.'); return; }
    if (!area.trim()) { setMessage('Industrial area is required.'); return; }
    if (!shift.trim()) { setMessage('Shift is required.'); return; }
    if (description.trim().length < 10) { setMessage('Description must be at least 10 characters.'); return; }

    setCreating(true);
    setMessage('');
    try {
      await createJob(token, {
        title, description, area, shift,
        skillsRequired: skills.split(',').map((s) => s.trim()).filter(Boolean),
        payMin: Number(payMin || 0),
        payMax: Number(payMax || 0),
        employmentType: 'Full-time',
      });
      setMessage('Job posted successfully.');
      setTitle(''); setArea(''); setShift(''); setSkills(''); setDescription(''); setPayMin(''); setPayMax('');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to create job.');
    } finally {
      setCreating(false);
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
                  <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Post a Job</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Create a new opening for job seekers</Text>
                </View>
              </View>
            </View>

            {/* ── White body ── */}
            <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 16 }}>

              <Field label="Job Title" value={title} onChangeText={setTitle} placeholder="e.g. Production Supervisor" icon="briefcase-outline" />
              <Field label="Industrial Area" value={area} onChangeText={setArea} placeholder="e.g. Jeedimetla, Nacharam…" icon="location-outline" />

              {/* Shift chips */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>Shift</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {SHIFTS.map((s) => (
                    <ShiftChip key={s} label={s} active={shift === s} onPress={() => setShift(shift === s ? '' : s)} />
                  ))}
                </ScrollView>
              </View>

              <Field label="Job Description" value={description} onChangeText={setDescription} placeholder="Describe the role, responsibilities and requirements (min 10 characters)" icon="document-text-outline" multiline />
              <Field label="Skills Required (comma separated)" value={skills} onChangeText={setSkills} placeholder="e.g. Welding, CNC operation, QC" icon="build-outline" />

              {/* Pay range */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Min Pay (₹)" value={payMin} onChangeText={setPayMin} placeholder="15000" icon="cash-outline" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Max Pay (₹)" value={payMax} onChangeText={setPayMax} placeholder="25000" icon="cash-outline" keyboardType="numeric" />
                </View>
              </View>

              {/* Message banner */}
              {message ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: isSuccess ? '#F0FDF4' : isWarning ? '#FFF7ED' : '#FEF2F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isSuccess ? '#BBF7D0' : isWarning ? '#FED7AA' : '#FECACA' }}>
                  <Ionicons name={isSuccess ? 'checkmark-circle' : 'alert-circle'} size={18} color={isSuccess ? '#22C55E' : isWarning ? ORANGE : '#EF4444'} />
                  <Text style={{ flex: 1, color: isSuccess ? '#15803D' : isWarning ? '#92400E' : '#B91C1C', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{message}</Text>
                </View>
              ) : null}

              {/* Submit */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleCreate(); }}
                disabled={creating}
                style={{ height: 54, backgroundColor: creating ? '#93A5E8' : BRAND_BLUE, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                {creating
                  ? <ActivityIndicator size="small" color={WHITE} />
                  : <Ionicons name="add-circle-outline" size={20} color={WHITE} />
                }
                <Text style={{ color: WHITE, fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>{creating ? 'Posting…' : 'Post Job'}</Text>
              </Pressable>

              <View style={{ height: 16 }} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
