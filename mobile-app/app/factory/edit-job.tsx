import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { InputField } from '../../components/ui/InputField';
import { Notice } from '../../components/ui/Notice';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getJobDetails, updateJob } from '../../services/jobs';
import { ApiError } from '../../lib/api';

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
        title: title.trim(),
        description: description.trim(),
        area: area.trim(),
        shift: shift.trim(),
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

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Edit job</Text>
          <Text style={styles.headerSub}>Update job details — changes go live immediately</Text>
        </View>
      </View>

      {loading ? (
        <EmptyState icon="hourglass-outline" title="Loading job" message="Fetching current job details…" />
      ) : loadError ? (
        <EmptyState icon="cloud-offline-outline" title="Unable to load" message={loadError} />
      ) : (
        <SectionCard title="Job details">
          <InputField icon="briefcase-outline" placeholder="Job title" value={title} onChangeText={setTitle} />
          <InputField icon="location-outline" placeholder="Industrial area (e.g. Jeedimetla)" value={area} onChangeText={setArea} />
          <InputField icon="time-outline" placeholder="Shift (e.g. Day / Night / Rotational)" value={shift} onChangeText={setShift} />
          <InputField
            icon="document-text-outline"
            placeholder="Job description (min 10 characters)"
            value={description}
            onChangeText={setDescription}
          />
          <InputField
            icon="build-outline"
            placeholder="Skills required (comma separated)"
            value={skills}
            onChangeText={setSkills}
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <InputField icon="cash-outline" placeholder="Min pay (₹)" value={payMin} onChangeText={setPayMin} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <InputField icon="cash-outline" placeholder="Max pay (₹)" value={payMax} onChangeText={setPayMax} keyboardType="numeric" />
            </View>
          </View>

          <Notice
            message={message}
            variant={
              message.includes('successfully') ? 'success'
              : message.includes('required') || message.includes('must') ? 'warning'
              : message ? 'error' : undefined
            }
          />

          <View style={styles.btnRow}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Discard</Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={handleSave} disabled={saving}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.submitText}>{saving ? 'Saving…' : 'Save changes'}</Text>
            </Pressable>
          </View>
        </SectionCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 4 },
  headerTitle: { color: colors.textInverse, fontSize: 24, fontWeight: '800' },
  headerSub: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
