import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Worker } from '../../types';
import { colors } from '../../constants/colors';

export function WorkerCard({ worker, matchScore }: { worker: Worker; matchScore?: number }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.role}>{worker.role}</Text>
        </View>
        <Pressable style={styles.shortlistButton}>
          <Text style={styles.shortlistText}>Shortlist</Text>
        </Pressable>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Area: {worker.area}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Exp: {worker.experience}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Shift: {worker.shift}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Salary: {worker.salaryPreference}</Text>
        </View>
      </View>

      {typeof matchScore === 'number' ? (
        <View style={styles.matchBar}>
          <Text style={styles.matchLabel}>Match score: {matchScore}%</Text>
        </View>
      ) : null}

      <View style={styles.skillsRow}>
        {worker.skills.map((skill) => (
          <View key={skill} style={styles.skillChip}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 16 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  name: { color: colors.text, fontWeight: '800', fontSize: 16 },
  role: { color: colors.textSoft, marginTop: 4 },
  shortlistButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shortlistText: { color: colors.textInverse, fontWeight: '700', fontSize: 12 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  infoBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: { color: '#475569', fontWeight: '600', fontSize: 12 },
  matchBar: {
    marginTop: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  matchLabel: { color: colors.success, fontWeight: '700', fontSize: 12 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  skillChip: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  skillText: { color: '#c2410c', fontWeight: '600', fontSize: 12 },
});
