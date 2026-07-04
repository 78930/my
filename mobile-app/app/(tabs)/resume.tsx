import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { getWorkerProfile, updateWorkerProfile } from '../../services/workers';
import { ApiError } from '../../lib/api';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

type Section = 'choose' | 'form' | 'upload';

function Field({ label, placeholder, value, onChangeText, keyboardType = 'default', multiline }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad'; multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3 }}>{label.toUpperCase()}</Text>
      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: focused ? BRAND_BLUE : '#E2E8F0', minHeight: 52, paddingHorizontal: 14, paddingVertical: multiline ? 12 : 0, justifyContent: multiline ? 'flex-start' : 'center' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#1E293B', paddingVertical: 0, textAlignVertical: multiline ? 'top' : 'center', minHeight: multiline ? 72 : undefined }}
        />
      </View>
    </View>
  );
}

export default function ResumeTab() {
  const { user, token } = useAuth();
  const [section, setSection] = useState<Section>('choose');
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<{ name: string; uri: string; size?: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    getWorkerProfile(token).then((p) => {
      if (p.fullName) setFullName(p.fullName);
      if (p.skills?.length) setSkills(p.skills.join(', '));
      if (p.experienceYears) setExperience(`${p.experienceYears} years`);
      if (p.preferredAreas?.length) setAddress(p.preferredAreas[0]);
      if (p.certifications?.length) setEducation(p.certifications.join(', '));
    }).catch(() => {});
  }, [token]);

  async function pickPdf() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPdfFile({ name: asset.name, uri: asset.uri, size: asset.size });
    } catch {
      Alert.alert('Error', 'Could not open document picker. Please try again.');
    }
  }

  async function handleSave() {
    if (!fullName.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    if (!token) { Alert.alert('Not signed in', 'Please sign in to save your resume.'); return; }
    setSaving(true);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const yearMatch = experience.match(/(\d+)\s*(?:year|yr)/i);
      const expYears = yearMatch ? Number(yearMatch[1]) : 0;
      const headline = (experience || education || '').slice(0, 100).trim();
      const certifications = education.split(',').map((e) => e.trim()).filter(Boolean);
      const preferredAreas = address.trim() ? [address.trim()] : undefined;
      await updateWorkerProfile(token, {
        fullName: fullName.trim(),
        ...(headline ? { headline } : {}),
        ...(skillsArray.length ? { skills: skillsArray } : {}),
        ...(expYears > 0 ? { experienceYears: expYears } : {}),
        ...(certifications.length ? { certifications } : {}),
        ...(preferredAreas ? { preferredAreas } : {}),
      });
      setSaved(true);
      Alert.alert('Resume saved', 'Your resume has been saved. Employers can now find your profile.');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Could not save resume. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  if (section === 'form') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 }}>
                <Pressable onPress={() => setSection('choose')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <Ionicons name="arrow-back" size={22} color={WHITE} />
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Back</Text>
                </Pressable>
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Resume Builder</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 4 }}>Fill in your details below</Text>
              </View>

              <View style={{ marginTop: -22, backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, flex: 1, padding: 20, gap: 20 }}>
                <View style={{ gap: 10 }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Personal info</Text>
                  <Field label="Full name" placeholder="e.g. Vikram Nalla" value={fullName} onChangeText={setFullName} />
                  <Field label="Phone number" placeholder="10-digit mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                  <Field label="Current area" placeholder="e.g. Jeedimetla, Hyderabad" value={address} onChangeText={setAddress} />
                </View>

                <View style={{ gap: 10 }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Skills</Text>
                  <Field label="Skills (comma separated)" placeholder="e.g. Welding, Machine operation, QC" value={skills} onChangeText={setSkills} multiline />
                </View>

                <View style={{ gap: 10 }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Work experience</Text>
                  <Field label="Experience" placeholder={"e.g.\n- 2 years at ABC Metals as Machine Operator"} value={experience} onChangeText={setExperience} multiline />
                </View>

                <View style={{ gap: 10 }}>
                  <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Education & certificates</Text>
                  <Field label="Education / certifications" placeholder="e.g. 10th Pass, ITI Fitter, Diploma Mechanical" value={education} onChangeText={setEducation} multiline />
                </View>

                {saved ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                    <Text style={{ color: '#16A34A', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Resume saved successfully!</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSave(); }}
                  disabled={saving}
                  style={{ height: 52, backgroundColor: saving ? '#93A5E0' : BRAND_BLUE, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                >
                  <Ionicons name="save-outline" size={18} color={WHITE} />
                  <Text style={{ color: WHITE, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>{saving ? 'Saving…' : 'Save resume'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Upload view ────────────────────────────────────────────────────────────
  if (section === 'upload') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 }}>
              <Pressable onPress={() => setSection('choose')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Ionicons name="arrow-back" size={22} color={WHITE} />
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>Back</Text>
              </Pressable>
              <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Upload Resume PDF</Text>
              <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 4 }}>Pick your PDF from phone files</Text>
            </View>

            <View style={{ marginTop: -22, backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, flex: 1, padding: 20, gap: 16 }}>
              <Pressable
                onPress={pickPdf}
                style={{ borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 18, paddingVertical: 44, alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC' }}
              >
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={pdfFile ? 'document-text' : 'cloud-upload-outline'} size={32} color={BRAND_BLUE} />
                </View>
                {pdfFile ? (
                  <>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center', paddingHorizontal: 16 }}>{pdfFile.name}</Text>
                    {pdfFile.size ? <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>{(pdfFile.size / 1024).toFixed(1)} KB</Text> : null}
                    <Text style={{ color: BRAND_BLUE, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Tap to change file</Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Tap to browse files</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>Supports PDF only</Text>
                  </>
                )}
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFF7ED', borderRadius: 14, padding: 14 }}>
                <Ionicons name="information-circle-outline" size={18} color={ORANGE} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, color: ORANGE, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', lineHeight: 20 }}>
                  PDF upload is coming soon. For now, use "Fill in my details" to build your profile.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Choose view (landing) ──────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Resume Builder</Text>
            <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 4 }}>
              Create your professional resume for employers to find you
            </Text>
          </View>

          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 14 }}>
            <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold' }}>Get started</Text>

            <Pressable onPress={() => { Haptics.selectionAsync(); setSection('form'); }} style={{ backgroundColor: WHITE, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="create-outline" size={26} color={BRAND_BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Fill in my details</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 3, lineHeight: 19 }}>Enter skills, experience & education to build a complete resume.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            <Pressable onPress={() => { Haptics.selectionAsync(); setSection('upload'); }} style={{ backgroundColor: WHITE, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="cloud-upload-outline" size={26} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Upload resume PDF</Text>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 3, lineHeight: 19 }}>Already have a resume? Upload your PDF directly.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 6 }}>Why build a resume?</Text>
            {([
              { icon: 'eye-outline' as const, text: 'Employers can find and contact you directly', color: BRAND_BLUE, bg: '#EBF0FF' },
              { icon: 'flash-outline' as const, text: 'Apply to jobs faster with one tap', color: ORANGE, bg: '#FFF7ED' },
              { icon: 'ribbon-outline' as const, text: 'Stand out with verified skills and experience', color: '#22C55E', bg: '#F0FDF4' },
            ]).map((item) => (
              <View key={item.icon} style={{ backgroundColor: WHITE, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={{ flex: 1, color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', lineHeight: 20 }}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
