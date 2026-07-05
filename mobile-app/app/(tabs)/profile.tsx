import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Avatar } from '../../components/ui/Avatar';
import { IconButton } from '../../components/ui/IconButton';
import { Spacer } from '../../components/ui/Spacer';
import { useTheme } from '../../theme/ThemeContext';
import { industrialAreas } from '../../constants/areas';
import { allRoles } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { languageLabels, supportedLanguages } from '../../lib/language';
import { getFactoryProfile, updateFactoryProfile } from '../../services/factory';
import { getWorkerProfile, updateWorkerProfile, requestVerification } from '../../services/workers';
import type { VerificationStatus } from '../../types';
import { uploadProfilePhoto } from '../../services/auth';

function parseCommaList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function toggleArrayItem(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export default function ProfileTab() {
  const { t, i18n } = useTranslation();
  const { token, user, isFactory, isWorker, refreshSession, signOut } = useAuth();
  const { colors, spacing, radii } = useTheme();
  const currentLanguage = supportedLanguages.includes(i18n.language as (typeof supportedLanguages)[number])
    ? (i18n.language as (typeof supportedLanguages)[number])
    : 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(
    user?.photoBase64 ? `data:${user.photoMimeType ?? 'image/jpeg'};base64,${user.photoBase64}` : null
  );
  const [photoUploading, setPhotoUploading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [certificationsText, setCertificationsText] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [salaryMin, setSalaryMin] = useState('0');
  const [availability, setAvailability] = useState('Immediate');
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [preferredShiftsText, setPreferredShiftsText] = useState('General, Rotational');
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('UNVERIFIED');
  const [verificationNote, setVerificationNote] = useState('');
  const [requestingVerif, setRequestingVerif] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [hrName, setHrName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [description, setDescription] = useState('');
  const [industrialAreaSelection, setIndustrialAreaSelection] = useState<string[]>([]);

  const [customAreaText, setCustomAreaText] = useState('');
  const [showCustomArea, setShowCustomArea] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [customFactoryAreaText, setCustomFactoryAreaText] = useState('');
  const [showCustomFactoryArea, setShowCustomFactoryArea] = useState(false);

  const suggestedRoles = useMemo(() => allRoles.slice(0, 18), []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!token || !user) { setLoading(false); return; }
      setLoading(true);
      setError('');
      setMessage('');

      try {
        if (isWorker) {
          const profile = await getWorkerProfile(token);
          if (cancelled) return;
          setFullName(profile.fullName || '');
          setHeadline(profile.headline || '');
          setSkillsText(profile.skills.join(', '));
          setCertificationsText(profile.certifications.join(', '));
          setExperienceYears(String(profile.experienceYears || 0));
          setSalaryMin(String(profile.salaryMin || 0));
          setAvailability(profile.availability || 'Immediate');
          setPreferredAreas(profile.preferredAreas || []);
          setPreferredRoles(profile.preferredRoles || []);
          setPreferredShiftsText((profile.preferredShifts || []).join(', '));
          setIsOpenToWork(profile.isOpenToWork ?? true);
          setVerificationStatus((profile.verificationStatus as VerificationStatus) ?? 'UNVERIFIED');
          setVerificationNote(profile.verificationNote ?? '');
        } else if (isFactory) {
          const profile = await getFactoryProfile(token);
          if (cancelled) return;
          setCompanyName(profile.companyName || '');
          setHrName(profile.hrName || '');
          setCompanySize(profile.companySize || '');
          setDescription(profile.description || '');
          setIndustrialAreaSelection(profile.industrialAreas || []);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Unable to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [token, user, isWorker, isFactory]);

  async function handleSaveWorker() {
    if (!token) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateWorkerProfile(token, {
        fullName,
        headline,
        skills: parseCommaList(skillsText),
        preferredRoles,
        experienceYears: Number(experienceYears || 0),
        certifications: parseCommaList(certificationsText),
        preferredAreas,
        preferredShifts: parseCommaList(preferredShiftsText),
        salaryMin: Number(salaryMin || 0),
        availability,
        isOpenToWork,
      });
      await refreshSession();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFactory() {
    if (!token) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateFactoryProfile(token, {
        companyName,
        hrName,
        companySize,
        description,
        industrialAreas: industrialAreaSelection,
      });
      await refreshSession();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) { Alert.alert('Error', 'Could not read image.'); return; }
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const uri = `data:${mimeType};base64,${asset.base64}`;
    setPhotoUri(uri);
    setPhotoUploading(true);
    try {
      await uploadProfilePhoto(token!, asset.base64, mimeType);
      await refreshSession();
    } catch {
      Alert.alert('Upload failed', 'Could not save your profile photo. Please try again.');
      setPhotoUri(user?.photoBase64 ? `data:${user.photoMimeType ?? 'image/jpeg'};base64,${user.photoBase64}` : null);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleRequestVerification() {
    if (!token) return;
    setRequestingVerif(true);
    try {
      const res = await requestVerification(token);
      setVerificationStatus(res.verificationStatus as VerificationStatus);
      Alert.alert('Submitted', res.message);
    } catch (err: any) {
      Alert.alert('Already submitted', err?.message ?? 'Could not submit. Try again.');
    } finally {
      setRequestingVerif(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace('/auth/welcome');
  }

  if (!user || !token) {
    return (
      <Screen>
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
            <Ionicons name="person-circle-outline" size={46} color={colors.primary} />
            <Text variant="h3">No active session</Text>
            <Text variant="body" color="secondary" align="center">Log in first to manage skills, industrial areas, hiring details, and profile settings.</Text>
            <Button label="Go to login" onPress={() => router.replace('/auth/welcome')} variant="primary" />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header card */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable onPress={handlePickPhoto} style={{ position: 'relative' }}>
            <Avatar name={user.name || 'U'} size="lg" imageUri={photoUri} />
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.background }}>
              <Ionicons name={photoUploading ? 'time-outline' : 'camera'} size={11} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="bodyLg">{user.name}</Text>
              {isWorker && verificationStatus === 'VERIFIED' && (
                <Ionicons name="shield-checkmark" size={16} color="#D97706" />
              )}
            </View>
            <Text variant="caption" color="secondary">{user.phone || user.email || 'No contact info'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <IconButton icon="settings-outline" onPress={() => router.push('/settings')} variant="default" accessibilityLabel="Settings" />
            <Button label="Logout" leftIcon="log-out-outline" onPress={handleLogout} variant="ghost" size="sm" />
          </View>
        </View>

        {loading ? (
          <>
            <Spacer size="sm" />
            <Text variant="caption" color="secondary">Loading profile…</Text>
          </>
        ) : null}
        {message ? (
          <>
            <Spacer size="sm" />
            <Text variant="label" color="success">{message}</Text>
          </>
        ) : null}
        {error ? (
          <>
            <Spacer size="sm" />
            <Text variant="label" color="error">{error}</Text>
          </>
        ) : null}
      </Card>

      {/* Language */}
      <Card>
        <Text variant="h3">{t('settings.languagePreference')}</Text>
        <Spacer size="xs" />
        <Text variant="caption" color="secondary">{t('settings.currentLanguage', { language: languageLabels[currentLanguage] })}</Text>
        <Spacer size="md" />
        <Button label={t('settings.changeLanguage')} onPress={() => router.push('/settings')} variant="secondary" size="sm" />
      </Card>

      {isWorker ? (
        <>
          {/* Basic details */}
          <Card>
            <Text variant="h3">Basic details</Text>
            <Spacer size="md" />
            <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" leftIcon="person-outline" />
            <Spacer size="md" />
            <Input label="Headline" value={headline} onChangeText={setHeadline} placeholder="Brief professional headline" leftIcon="megaphone-outline" />
            <Spacer size="md" />
            <Input label="Experience (years)" value={experienceYears} onChangeText={setExperienceYears} placeholder="e.g. 3" leftIcon="time-outline" keyboardType="numeric" />
            <Spacer size="md" />
            <Input label="Minimum salary (₹)" value={salaryMin} onChangeText={setSalaryMin} placeholder="e.g. 15000" leftIcon="cash-outline" keyboardType="numeric" />
            <Spacer size="md" />
            <Input label="Availability" value={availability} onChangeText={setAvailability} placeholder="Immediate / 15 Days / 30 Days" leftIcon="checkmark-done-outline" />
          </Card>

          {/* Areas and roles */}
          <Card>
            <Text variant="h3">Areas and roles</Text>
            <Text variant="caption" color="secondary">Tap to select, or add your own</Text>

            <Spacer size="md" />
            <Text variant="label" color="secondary">Preferred industrial areas</Text>
            <Spacer size="sm" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {[...industrialAreas, ...preferredAreas.filter((a) => !industrialAreas.includes(a))].map((area) => (
                <Chip
                  key={area}
                  label={area}
                  active={preferredAreas.includes(area)}
                  onPress={() => setPreferredAreas((items) => toggleArrayItem(items, area))}
                />
              ))}
              <Chip label="+ Others" active={showCustomArea} onPress={() => setShowCustomArea((v) => !v)} />
            </View>
            {showCustomArea ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Custom area"
                    value={customAreaText}
                    onChangeText={setCustomAreaText}
                    placeholder="Type area name…"
                  />
                </View>
                <Button
                  label="Add"
                  onPress={() => {
                    const val = customAreaText.trim();
                    if (val && !preferredAreas.includes(val)) setPreferredAreas((items) => [...items, val]);
                    setCustomAreaText('');
                    setShowCustomArea(false);
                  }}
                  variant="primary"
                  size="sm"
                />
              </View>
            ) : null}

            <Spacer size="lg" />
            <Text variant="label" color="secondary">Preferred roles</Text>
            <Spacer size="sm" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {[...suggestedRoles, ...preferredRoles.filter((r) => !suggestedRoles.includes(r))].map((role) => (
                <Chip
                  key={role}
                  label={role}
                  active={preferredRoles.includes(role)}
                  onPress={() => setPreferredRoles((items) => toggleArrayItem(items, role))}
                />
              ))}
              <Chip label="+ Others" active={showCustomRole} onPress={() => setShowCustomRole((v) => !v)} />
            </View>
            {showCustomRole ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Custom role"
                    value={customRoleText}
                    onChangeText={setCustomRoleText}
                    placeholder="Type role or job title…"
                  />
                </View>
                <Button
                  label="Add"
                  onPress={() => {
                    const val = customRoleText.trim();
                    if (val && !preferredRoles.includes(val)) setPreferredRoles((items) => [...items, val]);
                    setCustomRoleText('');
                    setShowCustomRole(false);
                  }}
                  variant="primary"
                  size="sm"
                />
              </View>
            ) : null}

            <Spacer size="lg" />
            <Input
              label="Preferred shifts (comma separated)"
              value={preferredShiftsText}
              onChangeText={setPreferredShiftsText}
              placeholder="e.g. General, Rotational"
              leftIcon="swap-horizontal-outline"
            />
          </Card>

          {/* Verification status */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: verificationStatus === 'VERIFIED' ? '#FEF3C7' : verificationStatus === 'PENDING' ? '#F1F5F9' : verificationStatus === 'REJECTED' ? '#FEF2F2' : '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons
                  name={verificationStatus === 'VERIFIED' ? 'shield-checkmark' : verificationStatus === 'PENDING' ? 'time-outline' : verificationStatus === 'REJECTED' ? 'close-circle-outline' : 'shield-outline'}
                  size={18}
                  color={verificationStatus === 'VERIFIED' ? '#D97706' : verificationStatus === 'PENDING' ? '#64748B' : verificationStatus === 'REJECTED' ? '#EF4444' : '#1240C7'}
                />
              </View>
              <Text variant="h3">Profile Verification</Text>
            </View>

            {verificationStatus === 'VERIFIED' && (
              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 14, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="checkmark-circle" size={22} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLg" style={{ color: '#92400E' }}>Profile Verified ✓</Text>
                  <Text variant="caption" style={{ color: '#B45309', marginTop: 2 }}>Your identity has been verified by Sketu admin. A gold badge appears on your public profile.</Text>
                </View>
              </View>
            )}

            {verificationStatus === 'PENDING' && (
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Ionicons name="time-outline" size={22} color="#94A3B8" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLg">Under Review</Text>
                  <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>Admin is reviewing your documents. You'll be notified when it's done.</Text>
                </View>
              </View>
            )}

            {verificationStatus === 'REJECTED' && (
              <>
                <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md }}>
                  <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLg" style={{ color: '#991B1B' }}>Verification Rejected</Text>
                    {verificationNote ? <Text variant="caption" style={{ color: '#B91C1C', marginTop: 2 }}>{verificationNote}</Text> : null}
                  </View>
                </View>
                <Button label={requestingVerif ? 'Submitting…' : 'Request Again'} onPress={handleRequestVerification} variant="secondary" fullWidth loading={requestingVerif} />
              </>
            )}

            {verificationStatus === 'UNVERIFIED' && (
              <>
                <Text variant="body" color="secondary">Get a gold verified badge on your profile. Upload your Aadhaar or PAN in the Documents tab, then request verification.</Text>
                <Spacer size="md" />
                <Button label={requestingVerif ? 'Submitting…' : 'Request Verification'} onPress={handleRequestVerification} variant="primary" fullWidth loading={requestingVerif} leftIcon="shield-checkmark-outline" />
              </>
            )}
          </Card>

          {/* Skills and certifications */}
          <Card>
            <Text variant="h3">Skills and certifications</Text>
            <Spacer size="md" />
            <Input label="Skills (comma separated)" value={skillsText} onChangeText={setSkillsText} placeholder="e.g. Welding, CNC, QC" leftIcon="build-outline" />
            <Spacer size="md" />
            <Input label="Certifications (comma separated)" value={certificationsText} onChangeText={setCertificationsText} placeholder="e.g. ITI Fitter, ISO Certified" leftIcon="ribbon-outline" />
            <Spacer size="md" />

            {/* Open to work toggle */}
            <Card pressable onPress={() => setIsOpenToWork((v) => !v)} padding={spacing.lg}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: isOpenToWork ? colors.successSoft : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isOpenToWork ? colors.success : colors.border }}>
                  <Ionicons name={isOpenToWork ? 'checkmark-circle' : 'close-circle-outline'} size={20} color={isOpenToWork ? colors.success : colors.textTertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLg">{isOpenToWork ? 'Open to work' : 'Not open to work'}</Text>
                  <Text variant="caption" color="secondary">{isOpenToWork ? 'Employers can find and contact you' : 'Your profile is hidden from employer searches'}</Text>
                </View>
              </View>
            </Card>

            <Spacer size="lg" />
            <Button
              label={saving ? 'Saving…' : 'Save profile'}
              onPress={handleSaveWorker}
              variant="primary"
              fullWidth
              loading={saving}
              disabled={loading}
            />
          </Card>
        </>
      ) : null}

      {isFactory ? (
        <>
          {/* Company details */}
          <Card>
            <Text variant="h3">Company details</Text>
            <Spacer size="md" />
            <Input label="Company name" value={companyName} onChangeText={setCompanyName} placeholder="Your company name" leftIcon="business-outline" />
            <Spacer size="md" />
            <Input label="HR / contact person" value={hrName} onChangeText={setHrName} placeholder="Name of HR or contact" leftIcon="people-outline" />
            <Spacer size="md" />
            <Input label="Company size" value={companySize} onChangeText={setCompanySize} placeholder="e.g. 50-200 employees" leftIcon="grid-outline" />
            <Spacer size="md" />
            <Input label="Company description" value={description} onChangeText={setDescription} placeholder="Brief description of your company" leftIcon="document-text-outline" multiline />
          </Card>

          {/* Industrial coverage */}
          <Card>
            <Text variant="h3">Industrial coverage</Text>
            <Text variant="caption" color="secondary">Select the areas where you hire job seekers</Text>
            <Spacer size="md" />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {[...industrialAreas, ...industrialAreaSelection.filter((a) => !industrialAreas.includes(a))].map((area) => (
                <Chip
                  key={area}
                  label={area}
                  active={industrialAreaSelection.includes(area)}
                  onPress={() => setIndustrialAreaSelection((items) => toggleArrayItem(items, area))}
                />
              ))}
              <Chip label="+ Others" active={showCustomFactoryArea} onPress={() => setShowCustomFactoryArea((v) => !v)} />
            </View>

            {showCustomFactoryArea ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Custom area"
                    value={customFactoryAreaText}
                    onChangeText={setCustomFactoryAreaText}
                    placeholder="Type area name…"
                  />
                </View>
                <Button
                  label="Add"
                  onPress={() => {
                    const val = customFactoryAreaText.trim();
                    if (val && !industrialAreaSelection.includes(val)) setIndustrialAreaSelection((items) => [...items, val]);
                    setCustomFactoryAreaText('');
                    setShowCustomFactoryArea(false);
                  }}
                  variant="primary"
                  size="sm"
                />
              </View>
            ) : null}

            <Spacer size="lg" />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="Select all" onPress={() => setIndustrialAreaSelection(industrialAreas)} variant="secondary" style={{ flex: 1 }} size="sm" />
              <Button label="Clear" onPress={() => setIndustrialAreaSelection([])} variant="ghost" style={{ flex: 1 }} size="sm" />
            </View>
            <Spacer size="md" />
            <Button
              label={saving ? 'Saving…' : 'Save profile'}
              onPress={handleSaveFactory}
              variant="primary"
              fullWidth
              loading={saving}
              disabled={loading}
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
