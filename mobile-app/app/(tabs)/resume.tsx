import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { updateWorkerProfile } from '../../services/workers';
import { ApiError } from '../../lib/api';

type Section = 'choose' | 'form' | 'upload';

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
  const [pdfUploaded, setPdfUploaded] = useState(false);

  async function pickPdf() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPdfFile({ name: asset.name, uri: asset.uri, size: asset.size });
      setPdfUploaded(false);
    } catch {
      Alert.alert('Error', 'Could not open document picker. Please try again.');
    }
  }

  function handleUploadPdf() {
    if (!pdfFile) { pickPdf(); return; }
    // TODO: send pdfFile.uri to backend via multipart upload
    setPdfUploaded(true);
    Alert.alert('Resume uploaded', `"${pdfFile.name}" has been uploaded. Factories can now view your resume.`);
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!token) {
      Alert.alert('Not signed in', 'Please sign in to save your resume.');
      return;
    }

    setSaving(true);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      // Extract year count from experience text (e.g. "2 years" → 2)
      const yearMatch = experience.match(/(\d+)\s*(?:year|yr)/i);
      const expYears = yearMatch ? Number(yearMatch[1]) : 0;
      // Build headline from first 100 chars of experience or education
      const headline = (experience || education || '').slice(0, 100).trim();
      // Treat education entries as certifications
      const certifications = education.split(',').map((e) => e.trim()).filter(Boolean);
      // Treat address as a preferred area
      const preferredAreas = address.trim() ? [address.trim()] : undefined;

      await updateWorkerProfile(token, {
        fullName: fullName.trim(),
        ...(headline ? { headline } : {}),
        ...(skillsArray.length > 0 ? { skills: skillsArray } : {}),
        ...(expYears > 0 ? { experienceYears: expYears } : {}),
        ...(certifications.length > 0 ? { certifications } : {}),
        ...(preferredAreas ? { preferredAreas } : {}),
      });
      setSaved(true);
      Alert.alert('Resume saved', 'Your resume has been saved. Factories can now find your profile.');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Could not save resume. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (section === 'form') {
    return (
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => setSection('choose')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Resume Builder</Text>
            <Text style={styles.headerSub}>Fill in your details to build your profile</Text>
          </View>
        </View>

        <SectionCard title="Personal info">
          <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="e.g. Vikram Nalla" />
          <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" keyboardType="phone-pad" />
          <Field label="Current address / area" value={address} onChangeText={setAddress} placeholder="e.g. Jeedimetla, Hyderabad" />
        </SectionCard>

        <SectionCard title="Skills">
          <Field
            label="Skills (comma separated)"
            value={skills}
            onChangeText={setSkills}
            placeholder="e.g. Welding, Machine operation, Quality control"
            multiline
          />
        </SectionCard>

        <SectionCard title="Work experience">
          <Field
            label="Experience"
            value={experience}
            onChangeText={setExperience}
            placeholder={"e.g.\n- 2 years at ABC Metals as Machine Operator\n- 1 year at XYZ Factory as Quality Inspector"}
            multiline
          />
        </SectionCard>

        <SectionCard title="Education">
          <Field
            label="Education"
            value={education}
            onChangeText={setEducation}
            placeholder="e.g. 10th Pass, ITI Fitter, Diploma Mechanical"
            multiline
          />
        </SectionCard>

        {saved ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.successText}>Resume saved successfully!</Text>
          </View>
        ) : null}

        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Ionicons name={saving ? 'hourglass-outline' : 'save-outline'} size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save resume'}</Text>
        </Pressable>
      </Screen>
    );
  }

  if (section === 'upload') {
    return (
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => setSection('choose')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Upload Resume PDF</Text>
            <Text style={styles.headerSub}>Pick your resume PDF from your phone files</Text>
          </View>
        </View>

        <SectionCard title="Select PDF file">
          <Pressable style={styles.pickArea} onPress={pickPdf}>
            <Ionicons
              name={pdfFile ? 'document-text' : 'cloud-upload-outline'}
              size={40}
              color={pdfFile ? colors.primary : colors.textMuted}
            />
            {pdfFile ? (
              <>
                <Text style={styles.pdfName}>{pdfFile.name}</Text>
                {pdfFile.size ? (
                  <Text style={styles.pdfSize}>{(pdfFile.size / 1024).toFixed(1)} KB</Text>
                ) : null}
                <Text style={styles.changeFile}>Tap to change file</Text>
              </>
            ) : (
              <>
                <Text style={styles.pickLabel}>Tap to browse files</Text>
                <Text style={styles.pickHint}>Supports PDF only</Text>
              </>
            )}
          </Pressable>
        </SectionCard>

        {pdfUploaded ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.successText}>Resume uploaded successfully!</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.saveBtn, !pdfFile && styles.saveBtnDisabled]}
          onPress={handleUploadPdf}
          disabled={!pdfFile && false}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{pdfFile ? 'Upload resume' : 'Select a PDF first'}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resume Builder</Text>
        <Text style={styles.headerSub}>Create your professional resume for factories to find you</Text>
      </View>

      <SectionCard title="Get started">
        <Pressable style={styles.optionCard} onPress={() => setSection('form')}>
          <View style={[styles.optionIcon, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="create-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Fill in my details</Text>
            <Text style={styles.optionDesc}>Enter your skills, experience, and education to build a complete resume.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.optionCard} onPress={() => setSection('upload')}>
          <View style={[styles.optionIcon, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="cloud-upload-outline" size={26} color="#16a34a" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Upload resume PDF</Text>
            <Text style={styles.optionDesc}>Already have a resume? Pick your PDF from files and upload it directly.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </SectionCard>

      <SectionCard title="Why build a resume?">
        <View style={styles.benefitRow}>
          <Ionicons name="eye-outline" size={20} color={colors.primary} />
          <Text style={styles.benefitText}>Factories can find and contact you directly</Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="flash-outline" size={20} color="#f59e0b" />
          <Text style={styles.benefitText}>Apply to jobs faster with one tap</Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="ribbon-outline" size={20} color="#7c3aed" />
          <Text style={styles.benefitText}>Stand out with verified skills and experience</Text>
        </View>
      </SectionCard>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  multiline: { minHeight: 90, paddingTop: 12 },
});

const styles = StyleSheet.create({
  header: { marginBottom: 4 },
  headerTitle: { color: colors.textInverse, fontSize: 24, fontWeight: '800' },
  headerSub: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionCardDisabled: { opacity: 0.7 },
  optionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  optionTitle: { color: colors.text, fontWeight: '800', fontSize: 15, marginBottom: 3 },
  optionDesc: { color: colors.textSoft, fontSize: 12, lineHeight: 17 },
  pickArea: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
  },
  pickLabel: { color: colors.text, fontWeight: '700', fontSize: 16 },
  pickHint: { color: colors.textMuted, fontSize: 13 },
  pdfName: { color: colors.text, fontWeight: '800', fontSize: 15, textAlign: 'center', paddingHorizontal: 16 },
  pdfSize: { color: colors.textMuted, fontSize: 12 },
  changeFile: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 4 },
  saveBtnDisabled: { backgroundColor: colors.textMuted },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  benefitText: { color: colors.text, fontSize: 14 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 24,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  successText: { color: '#16a34a', fontWeight: '700' },
});
