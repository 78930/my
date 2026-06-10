import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';

type DocStatus = 'not_uploaded' | 'pending' | 'verified';

interface DocItem {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  hint: string;
  status: DocStatus;
  imageUri?: string;
}

const INITIAL_DOCS: DocItem[] = [
  { id: 'aadhaar', label: 'Aadhaar Card', icon: 'card-outline', hint: 'Front and back photo of your Aadhaar card', status: 'not_uploaded' },
  { id: 'pan', label: 'PAN Card', icon: 'id-card-outline', hint: 'Photo of your PAN card', status: 'not_uploaded' },
  { id: 'dl', label: "Driver's Licence", icon: 'car-outline', hint: 'Front side of your driving licence', status: 'not_uploaded' },
  { id: 'passbook', label: 'Bank Passbook / Cheque', icon: 'wallet-outline', hint: 'First page of passbook or cancelled cheque', status: 'not_uploaded' },
];

export default function DocumentsTab() {
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const [picking, setPicking] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  async function requestAndPick(docId: string, source: 'camera' | 'gallery') {
    setPicking(null);

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take a photo.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Gallery permission is required to pick a photo.');
        return;
      }
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3], mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setDocs((prev) =>
      prev.map((d) => d.id === docId ? { ...d, status: 'pending', imageUri: uri } : d)
    );
  }

  function handleUploadTap(docId: string) {
    setPicking(docId);
  }

  const verified = docs.filter((d) => d.status === 'verified').length;
  const pending = docs.filter((d) => d.status === 'pending').length;
  const notUploaded = docs.filter((d) => d.status === 'not_uploaded').length;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
        <Text style={styles.headerSub}>Upload ID proofs for factory verification</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatusChip icon="checkmark-circle" color="#16a34a" bg="#f0fdf4" label={`${verified} Verified`} />
        <StatusChip icon="time-outline" color="#d97706" bg="#fffbeb" label={`${pending} Pending`} />
        <StatusChip icon="cloud-upload-outline" color={colors.primary} bg="#eff6ff" label={`${notUploaded} To upload`} />
      </View>

      <SectionCard title="Identity documents">
        {docs.map((doc) => (
          <View key={doc.id} style={styles.docRow}>
            {/* Icon or thumbnail */}
            <Pressable
              style={[styles.docThumb, { backgroundColor: statusBg(doc.status) }]}
              onPress={doc.imageUri ? () => setPreviewUri(doc.imageUri!) : undefined}
            >
              {doc.imageUri ? (
                <Image source={{ uri: doc.imageUri }} style={styles.thumbImage} />
              ) : (
                <Ionicons name={doc.icon} size={22} color={statusColor(doc.status)} />
              )}
            </Pressable>

            {/* Info */}
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>{doc.label}</Text>
              <Text style={styles.docHint}>{doc.hint}</Text>
              <StatusBadge status={doc.status} />
            </View>

            {/* Action */}
            {doc.status === 'verified' ? (
              <Ionicons name="checkmark-circle" size={26} color="#16a34a" style={styles.verifiedIcon} />
            ) : (
              <Pressable
                style={[styles.uploadBtn, doc.status === 'pending' && styles.reuploadBtn]}
                onPress={() => handleUploadTap(doc.id)}
              >
                <Ionicons
                  name={doc.status === 'pending' ? 'refresh-outline' : 'cloud-upload-outline'}
                  size={15}
                  color={doc.status === 'pending' ? '#d97706' : colors.primary}
                />
                <Text style={[styles.uploadBtnText, doc.status === 'pending' && { color: '#d97706' }]}>
                  {doc.status === 'pending' ? 'Re-upload' : 'Upload'}
                </Text>
              </Pressable>
            )}
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Why verify documents?">
        <View style={styles.benefitRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.benefitText}>Verified workers get a trust badge visible to factories</Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="flash-outline" size={20} color="#f59e0b" />
          <Text style={styles.benefitText}>Factories prefer verified candidates for quick hiring</Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="lock-closed-outline" size={20} color="#7c3aed" />
          <Text style={styles.benefitText}>Your documents are stored securely and encrypted</Text>
        </View>
      </SectionCard>

      {/* Source picker modal */}
      <Modal visible={picking !== null} transparent animationType="slide" onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPicking(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Upload document</Text>
            <Text style={styles.modalSub}>Choose how to add your photo</Text>

            <Pressable style={styles.modalOption} onPress={() => picking && requestAndPick(picking, 'camera')}>
              <View style={[styles.modalOptionIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="camera-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>Take a photo</Text>
                <Text style={styles.modalOptionDesc}>Use your camera to photograph the document</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.modalOption} onPress={() => picking && requestAndPick(picking, 'gallery')}>
              <View style={[styles.modalOptionIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="image-outline" size={24} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>Choose from gallery</Text>
                <Text style={styles.modalOptionDesc}>Pick an existing photo from your phone</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.modalCancel} onPress={() => setPicking(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Full-screen image preview */}
      <Modal visible={previewUri !== null} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewUri(null)}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          ) : null}
          <View style={styles.previewClose}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  const configs = {
    verified: { bg: '#f0fdf4', text: '#16a34a', label: 'Verified' },
    pending: { bg: '#fffbeb', text: '#d97706', label: 'Under review' },
    not_uploaded: { bg: '#f1f5f9', text: colors.textMuted, label: 'Not uploaded' },
  };
  const c = configs[status];
  return (
    <View style={[badge.wrap, { backgroundColor: c.bg }]}>
      <Text style={[badge.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

function StatusChip({ icon, color, bg, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string; label: string }) {
  return (
    <View style={[chip.wrap, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[chip.text, { color }]}>{label}</Text>
    </View>
  );
}

function statusColor(s: DocStatus) {
  return s === 'verified' ? '#16a34a' : s === 'pending' ? '#d97706' : colors.primary;
}
function statusBg(s: DocStatus) {
  return s === 'verified' ? '#f0fdf4' : s === 'pending' ? '#fffbeb' : '#eff6ff';
}

const badge = StyleSheet.create({
  wrap: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  text: { fontSize: 11, fontWeight: '700' },
});
const chip = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  text: { fontWeight: '700', fontSize: 12 },
});

const styles = StyleSheet.create({
  header: { marginBottom: 4 },
  headerTitle: { color: colors.textInverse, fontSize: 24, fontWeight: '800' },
  headerSub: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: 52, height: 52, borderRadius: 14 },
  docInfo: { flex: 1 },
  docLabel: { color: colors.text, fontWeight: '800', fontSize: 14 },
  docHint: { color: colors.textSoft, fontSize: 12, marginTop: 2, lineHeight: 17 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  reuploadBtn: { backgroundColor: '#fffbeb' },
  uploadBtnText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  verifiedIcon: { marginTop: 4 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  benefitText: { color: colors.text, fontSize: 14, flex: 1 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  modalSub: { color: colors.textSoft, fontSize: 13, marginTop: -4, marginBottom: 4 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  modalOptionDesc: { color: colors.textSoft, fontSize: 12, marginTop: 2 },
  modalCancel: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  // Preview
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: '90%', height: '80%' },
  previewClose: { position: 'absolute', top: 52, right: 20 },
});
