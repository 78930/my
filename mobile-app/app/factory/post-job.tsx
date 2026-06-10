import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { InputField } from '../../components/ui/InputField';
import { Notice } from '../../components/ui/Notice';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { createJob } from '../../services/jobs';
import { ApiError } from '../../lib/api';

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
        title,
        description,
        area,
        shift,
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

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Post a job</Text>
          <Text style={styles.headerSub}>Fill in the details to create a new opening</Text>
        </View>
      </View>

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

        <Pressable style={styles.submitBtn} onPress={handleCreate} disabled={creating}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.submitText}>{creating ? 'Posting…' : 'Post job'}</Text>
        </Pressable>
      </SectionCard>
    </Screen>
  );
}

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
  row: { flexDirection: 'row', gap: 10 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
