import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { industrialAreas } from '../../constants/areas';
import { allRoles } from '../../constants/roles';
import { UserType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { updateFactoryProfile } from '../../services/factory';
import { updateWorkerProfile } from '../../services/workers';

const BRAND_BLUE = '#1240C7';
const ICON_BLUE = '#5B8DFF';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

// ─── Pill chip ────────────────────────────────────────────────────────────────
function PillChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? BRAND_BLUE : '#F1F5F9',
        borderWidth: 1.5,
        borderColor: active ? BRAND_BLUE : '#E2E8F0',
      }}
    >
      <Text style={{ color: active ? WHITE : '#475569', fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
function Field({
  icon, placeholder, value, onChangeText,
  keyboardType = 'default', autoCapitalize = 'none',
  maxLength, multiline, numberOfLines,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: multiline ? 'column' : 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: focused ? BRAND_BLUE : '#E2E8F0',
        minHeight: 52,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 14 : 0,
        gap: 10,
      }}
    >
      {!multiline && <Ionicons name={icon} size={17} color={focused ? BRAND_BLUE : '#94A3B8'} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          fontSize: 15,
          fontFamily: 'PlusJakartaSans_500Medium',
          color: '#1E293B',
          paddingVertical: multiline ? 0 : 0,
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? 80 : undefined,
        }}
      />
    </View>
  );
}

export default function SignupScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = useMemo<UserType>(
    () => (params.type === 'factory' ? 'factory' : 'worker'),
    [params.type]
  );
  const isFactory = type === 'factory';

  const { signUpWorker, signUpFactory, isSubmitting } = useAuth();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hrName, setHrName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedArea, setSelectedArea] = useState('Jeedimetla');
  const [selectedRole, setSelectedRole] = useState(
    isFactory ? 'Plant Head / Factory Head' : 'Production Supervisor'
  );
  const [customArea, setCustomArea] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const finalArea = selectedArea === 'Others' ? customArea.trim() : selectedArea;
  const finalRole = selectedRole === 'Others' ? customRole.trim() : selectedRole;

  async function handleSignup() {
    setError('');
    const nameVal = isFactory ? companyName.trim() || hrName.trim() : fullName.trim();
    if (nameVal.length < 2) { setError('Please enter your full name.'); return; }
    if (phone.trim().replace(/\D/g, '').length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    if (selectedArea === 'Others' && !customArea.trim()) { setError('Please enter your industrial area.'); return; }
    if (!isFactory && selectedRole === 'Others' && !customRole.trim()) { setError('Please enter your primary role.'); return; }

    try {
      if (isFactory) {
        const token = await signUpFactory({ name: companyName.trim() || hrName.trim(), phone });
        try {
          await updateFactoryProfile(token, {
            companyName: companyName.trim(),
            hrName: hrName.trim(),
            description: description.trim() || undefined,
          });
        } catch { /* non-fatal */ }
      } else {
        const token = await signUpWorker({ name: fullName.trim(), phone });
        if (token) {
          try {
            await updateWorkerProfile(token, {
              fullName: fullName.trim(),
              preferredAreas: finalArea ? [finalArea] : [],
              preferredRoles: finalRole ? [finalRole] : [],
            });
          } catch { /* non-fatal */ }
        }
      }
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign up failed. Please try again.');
    }
  }

  const areaList = [...industrialAreas, 'Others'];
  const roleList = [...allRoles.slice(0, 20), 'Others'];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* ── Blue header ──────────────────────────────────── */}
            <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 52 }}>
              <Pressable
                onPress={() => router.back()}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}
              >
                <Ionicons name="arrow-back" size={22} color={WHITE} />
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Back</Text>
              </Pressable>
              <Text style={{ color: WHITE, fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.5, marginBottom: 6 }}>
                Create account
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: isFactory ? ORANGE : ICON_BLUE }}>
                  <Text style={{ color: WHITE, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {isFactory ? 'Employer' : 'Job Seeker'}
                  </Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>
                  Fill in your details below
                </Text>
              </View>
            </View>

            {/* ── White body ───────────────────────────────────── */}
            <View style={{ marginTop: -26, backgroundColor: WHITE, borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32, gap: 16 }}>

              {/* Personal details */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {isFactory ? 'Company details' : 'Personal details'}
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {isFactory ? (
                  <>
                    <Field icon="business-outline" placeholder="Company / factory name" value={companyName} onChangeText={setCompanyName} autoCapitalize="words" />
                    <Field icon="person-outline" placeholder="HR / contact person name" value={hrName} onChangeText={setHrName} autoCapitalize="words" />
                    <Field icon="document-text-outline" placeholder="Brief company description (optional)" value={description} onChangeText={setDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
                  </>
                ) : (
                  <Field icon="person-outline" placeholder="Your full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                )}

                {/* Phone */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', height: 52, paddingHorizontal: 14, gap: 10 }}>
                  <Ionicons name="call-outline" size={17} color="#94A3B8" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#E2E8F0' }}>
                    <Text style={{ color: '#1E293B', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>+91</Text>
                    <Ionicons name="chevron-down" size={12} color="#94A3B8" />
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={{ flex: 1, fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: '#1E293B', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* Area section */}
              <View style={{ gap: 10 }}>
                <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {isFactory ? 'Industrial area' : 'Preferred area'}
                </Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>
                  {isFactory ? 'Where is your plant / factory located?' : 'Which area are you looking for work in?'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {areaList.map((area) => (
                    <PillChip key={area} label={area} active={selectedArea === area} onPress={() => setSelectedArea(area)} />
                  ))}
                </ScrollView>
                {selectedArea === 'Others' && (
                  <Field icon="location-outline" placeholder="Enter your industrial area…" value={customArea} onChangeText={setCustomArea} autoCapitalize="words" />
                )}
              </View>

              {/* Role section — worker only */}
              {!isFactory && (
                <View style={{ gap: 10 }}>
                  <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Primary role</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>
                    What is your main job role or skill?
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {roleList.map((role) => (
                      <PillChip key={role} label={role} active={selectedRole === role} onPress={() => setSelectedRole(role)} />
                    ))}
                  </ScrollView>
                  {selectedRole === 'Others' && (
                    <Field icon="briefcase-outline" placeholder="Enter your job title or role…" value={customRole} onChangeText={setCustomRole} autoCapitalize="words" />
                  )}
                </View>
              )}

              {/* Error */}
              {error ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 }}>
                  <Ionicons name="alert-circle-outline" size={17} color="#EF4444" />
                  <Text style={{ flex: 1, color: '#EF4444', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{error}</Text>
                </View>
              ) : null}

              {/* Submit */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSignup(); }}
                disabled={isSubmitting}
                style={{ height: 54, backgroundColor: isSubmitting ? '#93A5E0' : BRAND_BLUE, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
              >
                {isSubmitting
                  ? <ActivityIndicator size="small" color={WHITE} />
                  : <>
                      <Text style={{ color: WHITE, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>Create account</Text>
                      <Ionicons name="checkmark-circle-outline" size={18} color={WHITE} />
                    </>
                }
              </Pressable>

              {/* Login link */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>Already have an account?</Text>
                <Pressable onPress={() => router.replace('/auth/welcome')}>
                  <Text style={{ color: BRAND_BLUE, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>Log in</Text>
                </Pressable>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
