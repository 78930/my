import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { Job } from '../../types';

export function JobDetailCard({ job }: { job: Job }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{job.title || job.role}</Text>
      <Text style={styles.company}>{job.company}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaChip}>{job.area}</Text>
        <Text style={styles.metaChip}>{job.shift}</Text>
        <Text style={styles.metaChip}>{job.pay}</Text>
        <Text style={styles.metaChip}>{job.employmentType || 'Full-time'}</Text>
      </View>

      <Text style={styles.sectionLabel}>Role summary</Text>
      <Text style={styles.description}>{job.description || 'No description available yet.'}</Text>

      <Text style={styles.sectionLabel}>Skills required</Text>
      <View style={styles.skillsRow}>
        {job.skills.length ? (
          job.skills.map((skill) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.description}>Factory has not added skills for this role yet.</Text>
        )}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerBox}>
          <Text style={styles.footerValue}>{job.status || 'OPEN'}</Text>
          <Text style={styles.footerLabel}>Status</Text>
        </View>
        <View style={styles.footerBox}>
          <Text style={styles.footerValue}>{job.pay}</Text>
          <Text style={styles.footerLabel}>Compensation</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 16 },
  title: { color: colors.text, fontWeight: '800', fontSize: 22, lineHeight: 28 },
  company: { color: colors.textSoft, marginTop: 6, fontSize: 15 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metaChip: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  sectionLabel: { color: colors.text, fontWeight: '800', marginTop: 18, marginBottom: 8 },
  description: { color: colors.textSoft, lineHeight: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  skillText: { color: '#c2410c', fontWeight: '600', fontSize: 12 },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  footerBox: { flex: 1, backgroundColor: colors.panel, borderRadius: 18, padding: 14 },
  footerValue: { color: colors.textInverse, fontSize: 16, fontWeight: '800' },
  footerLabel: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
});
