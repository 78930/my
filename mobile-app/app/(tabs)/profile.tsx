import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { InputField } from '../../components/ui/InputField';
import { Pill } from '../../components/ui/Pill';
import { colors } from '../../constants/colors';
import { industrialAreas } from '../../constants/areas';
import { allRoles } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { getFactoryProfile, updateFactoryProfile } from '../../services/factory';
import { getWorkerProfile, updateWorkerProfile } from '../../services/workers';

function parseCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleArrayItem(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export default function ProfileTab() {
  const { token, user, isFactory, isWorker, refreshSession, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  const [companyName, setCompanyName] = useState('');
  const [hrName, setHrName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [description, setDescription] = useState('');
  const [industrialAreaSelection, setIndustrialAreaSelection] = useState<string[]>([]);

  const suggestedRoles = useMemo(() => allRoles.slice(0, 18), []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!token || !user) {
        setLoading(false);
        return;
      }

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
        const nextMessage = err instanceof ApiError ? err.message : 'Unable to load profile';
        setError(nextMessage);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
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
      setMessage('Worker profile updated successfully.');
    } catch (err) {
      const nextMessage = err instanceof ApiError ? err.message : 'Unable to update worker profile';
      setError(nextMessage);
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
      setMessage('Factory profile updated successfully.');
    } catch (err) {
      const nextMessage = err instanceof ApiError ? err.message : 'Unable to update factory profile';
      setError(nextMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace('/auth/welcome');
  }

  if (!user || !token) {
    return (
      <Screen>
        <SectionCard title="Profile" subtitle="Sign in to edit worker or factory details.">
          <View style={styles.emptyState}>
            <Ionicons name="person-circle-outline" size={46} color={colors.primary} />
            <Text style={styles.emptyTitle}>No active session</Text>
            <Text style={styles.emptyText}>Log in first to manage skills, industrial areas, hiring details, and profile settings.</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.replace('/auth/welcome')}>
              <Text style={styles.primaryButtonText}>Go to login</Text>
            </Pressable>
          </View>
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionCard
        title={isWorker ? 'Worker profile' : 'Factory profile'}
        subtitle={
          isWorker
            ? 'Edit your headline, skills, salary preference, roles and industrial areas.'
            : 'Edit company details, HR contact and target industrial areas.'
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.profileBadge}>
            <Ionicons name={isWorker ? 'person-outline' : 'business-outline'} size={20} color={colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{user.name}</Text>
            <Text style={styles.headerSubtitle}>{user.email}</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color={colors.textInverse} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {loading ? <Text style={styles.helperText}>Loading profile...</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </SectionCard>

      {isWorker ? (
        <>
          <SectionCard title="Basic details" subtitle="These values are saved to /api/workers/me/profile">
            <InputField icon="person-outline" placeholder="Full name" value={fullName} onChangeText={setFullName} />
            <InputField icon="megaphone-outline" placeholder="Headline" value={headline} onChangeText={setHeadline} />
            <InputField
              icon="time-outline"
              placeholder="Experience in years"
              value={experienceYears}
              onChangeText={setExperienceYears}
            />
            <InputField icon="cash-outline" placeholder="Minimum salary" value={salaryMin} onChangeText={setSalaryMin} />
            <InputField
              icon="checkmark-done-outline"
              placeholder="Availability (Immediate / 15 Days / 30 Days)"
              value={availability}
              onChangeText={setAvailability}
            />
          </SectionCard>

          <SectionCard title="Areas and roles" subtitle="Tap quick picks or keep editing with search-based selection later">
            <Text style={styles.label}>Preferred industrial areas</Text>
            <View style={styles.pillsWrap}>
              {industrialAreas.map((area) => (
                <Pill
                  key={area}
                  label={area}
                  active={preferredAreas.includes(area)}
                  onPress={() => setPreferredAreas((items) => toggleArrayItem(items, area))}
                />
              ))}
            </View>

            <Text style={styles.label}>Preferred roles</Text>
            <View style={styles.pillsWrap}>
              {suggestedRoles.map((role) => (
                <Pill
                  key={role}
                  label={role}
                  active={preferredRoles.includes(role)}
                  onPress={() => setPreferredRoles((items) => toggleArrayItem(items, role))}
                />
              ))}
            </View>

            <InputField
              icon="swap-horizontal-outline"
              placeholder="Preferred shifts comma separated"
              value={preferredShiftsText}
              onChangeText={setPreferredShiftsText}
            />
          </SectionCard>

          <SectionCard title="Skills and certifications" subtitle="Enter comma-separated values for quick editing">
            <InputField icon="build-outline" placeholder="Skills" value={skillsText} onChangeText={setSkillsText} />
            <InputField
              icon="ribbon-outline"
              placeholder="Certifications"
              value={certificationsText}
              onChangeText={setCertificationsText}
            />
            <Pressable
              style={[styles.toggleButton, isOpenToWork ? styles.toggleButtonActive : undefined]}
              onPress={() => setIsOpenToWork((value) => !value)}
            >
              <Ionicons
                name={isOpenToWork ? 'checkmark-circle' : 'close-circle-outline'}
                size={18}
                color={isOpenToWork ? colors.success : colors.textSoft}
              />
              <Text style={styles.toggleButtonText}>{isOpenToWork ? 'Open to work' : 'Not open to work'}</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleSaveWorker} disabled={saving || loading}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save worker profile'}</Text>
            </Pressable>
          </SectionCard>
        </>
      ) : null}

      {isFactory ? (
        <>
          <SectionCard title="Company details" subtitle="These values are saved to /api/factories/me/profile">
            <InputField icon="business-outline" placeholder="Company name" value={companyName} onChangeText={setCompanyName} />
            <InputField icon="people-outline" placeholder="HR / contact person" value={hrName} onChangeText={setHrName} />
            <InputField icon="grid-outline" placeholder="Company size" value={companySize} onChangeText={setCompanySize} />
            <InputField
              icon="document-text-outline"
              placeholder="Company description"
              value={description}
              onChangeText={setDescription}
            />
          </SectionCard>

          <SectionCard title="Industrial coverage" subtitle="Select the areas where your factory hires workers">
            <View style={styles.pillsWrap}>
              {industrialAreas.map((area) => (
                <Pill
                  key={area}
                  label={area}
                  active={industrialAreaSelection.includes(area)}
                  onPress={() => setIndustrialAreaSelection((items) => toggleArrayItem(items, area))}
                />
              ))}
            </View>
            <View style={styles.quickActions}>
              <Pressable style={styles.softButton} onPress={() => setIndustrialAreaSelection(industrialAreas)}>
                <Text style={styles.softButtonText}>Select all</Text>
              </Pressable>
              <Pressable style={styles.softButton} onPress={() => setIndustrialAreaSelection([])}>
                <Text style={styles.softButtonText}>Clear</Text>
              </Pressable>
            </View>
            <Pressable style={styles.primaryButton} onPress={handleSaveFactory} disabled={saving || loading}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save factory profile'}</Text>
            </Pressable>
          </SectionCard>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  emptyText: {
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  headerSubtitle: {
    color: colors.textSoft,
    marginTop: 4,
  },
  helperText: {
    color: colors.textSoft,
  },
  successText: {
    color: colors.success,
    lineHeight: 20,
  },
  errorText: {
    color: '#b91c1c',
    lineHeight: 20,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  toggleButtonActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  toggleButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontWeight: '800',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  softButton: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  softButtonText: {
    color: colors.primary,
    fontWeight: '800',
  },
});
