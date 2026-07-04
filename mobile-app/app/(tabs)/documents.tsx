import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  getDocument,
  type DocumentType,
  type DocumentRecord,
} from '../../services/workers';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

type DocStatus = 'not_uploaded' | 'uploading' | 'uploaded' | 'error';

interface DocItem {
  id: DocumentType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  hint: string;
  status: DocStatus;
  imageDataUri?: string;
  uploadedAt?: string;
}

const DOC_DEFS: Omit<DocItem, 'status'>[] = [
  { id: 'AADHAAR',         label: 'Aadhaar Card',          icon: 'card-outline',    hint: 'Front and back photo of your Aadhaar card' },
  { id: 'PAN',             label: 'PAN Card',              icon: 'id-card-outline', hint: 'Photo of your PAN card' },
  { id: 'DRIVING_LICENSE', label: "Driver's Licence",      icon: 'car-outline',     hint: 'Front side of your driving licence' },
  { id: 'BANK_PASSBOOK',   label: 'Bank Passbook / Cheque', icon: 'wallet-outline', hint: 'First page of passbook or cancelled cheque' },
];

function statusColor(s: DocStatus) {
  if (s === 'uploaded') return '#22C55E';
  if (s === 'uploading') return ORANGE;
  if (s === 'error') return '#EF4444';
  return BRAND_BLUE;
}
function statusBg(s: DocStatus) {
  if (s === 'uploaded') return '#F0FDF4';
  if (s === 'uploading') return '#FFF7ED';
  if (s === 'error') return '#FEF2F2';
  return '#EBF0FF';
}
function statusLabel(s: DocStatus) {
  if (s === 'uploaded') return 'Uploaded';
  if (s === 'uploading') return 'Uploading…';
  if (s === 'error') return 'Upload failed';
  return 'Not uploaded';
}
function statusIcon(s: DocStatus): React.ComponentProps<typeof Ionicons>['name'] {
  if (s === 'uploaded') return 'checkmark-circle';
  if (s === 'uploading') return 'time-outline';
  if (s === 'error') return 'alert-circle-outline';
  return 'ellipse-outline';
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DocumentsTab() {
  const { token } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>(DOC_DEFS.map((d) => ({ ...d, status: 'not_uploaded' })));
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<DocumentType | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const mergeRecord = useCallback((rec: DocumentRecord) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === rec.type
          ? { ...d, status: 'uploaded', uploadedAt: rec.updatedAt }
          : d
      )
    );
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const items = await listDocuments(token);
      setDocs(DOC_DEFS.map((def) => {
        const found = items.find((r) => r.type === def.id);
        return found
          ? { ...def, status: 'uploaded' as DocStatus, uploadedAt: found.updatedAt }
          : { ...def, status: 'not_uploaded' as DocStatus };
      }));
    } catch {
      // keep default state on error
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  async function requestAndPick(docId: DocumentType, source: 'camera' | 'gallery') {
    setPicking(null);
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission is required.'); return; }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery permission is required.'); return; }
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3], base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3], mediaTypes: ['images'], base64: true });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) { Alert.alert('Error', 'Could not read image data.'); return; }

    // Mark as uploading
    setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'uploading' } : d));

    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      await uploadDocument(token!, docId, asset.base64, mimeType);
      setDocs((prev) => prev.map((d) => d.id === docId
        ? { ...d, status: 'uploaded', uploadedAt: new Date().toISOString() }
        : d
      ));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'error' } : d));
      Alert.alert('Upload failed', 'Could not upload the document. Please try again.');
    }
  }

  async function handleDelete(docId: DocumentType) {
    Alert.alert('Remove document', 'Are you sure you want to remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await deleteDocument(token!, docId);
            setDocs((prev) => prev.map((d) => d.id === docId
              ? { ...d, status: 'not_uploaded', uploadedAt: undefined, imageDataUri: undefined }
              : d
            ));
          } catch {
            Alert.alert('Error', 'Could not remove the document.');
          }
        },
      },
    ]);
  }

  async function handlePreview(docId: DocumentType) {
    setPreviewLoading(true);
    setPreviewUri('loading');
    try {
      const res = await getDocument(token!, docId);
      setPreviewUri(`data:${res.mimeType};base64,${res.imageBase64}`);
    } catch {
      setPreviewUri(null);
      Alert.alert('Error', 'Could not load document preview.');
    } finally {
      setPreviewLoading(false);
    }
  }

  const uploaded = docs.filter((d) => d.status === 'uploaded').length;
  const notUploaded = docs.filter((d) => d.status === 'not_uploaded' || d.status === 'error').length;
  const uploading = docs.filter((d) => d.status === 'uploading').length;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Documents</Text>
            <Text style={styles.headerSub}>Upload ID proofs for employer verification</Text>
            <View style={styles.statRow}>
              {([
                { label: `${uploaded} Uploaded`,  icon: 'checkmark-circle' as const, color: '#34D399', bg: 'rgba(52,211,153,0.20)' },
                { label: `${uploading} Uploading`, icon: 'time-outline' as const,     color: ORANGE,    bg: 'rgba(255,140,0,0.20)' },
                { label: `${notUploaded} To do`,   icon: 'cloud-upload-outline' as const, color: '#93C5FD', bg: 'rgba(147,197,253,0.20)' },
              ]).map((s) => (
                <View key={s.label} style={[styles.statChip, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon} size={15} color={s.color} />
                  <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.sectionTitle}>Identity documents</Text>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={BRAND_BLUE} />
                <Text style={{ color: '#64748B', marginTop: 12, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 }}>Loading your documents…</Text>
              </View>
            ) : (
              docs.map((doc) => (
                <View key={doc.id} style={styles.docCard}>
                  {/* Thumbnail */}
                  <Pressable
                    style={[styles.thumbnail, { backgroundColor: statusBg(doc.status) }]}
                    onPress={doc.status === 'uploaded' ? () => handlePreview(doc.id) : undefined}
                  >
                    {doc.status === 'uploading'
                      ? <ActivityIndicator size="small" color={ORANGE} />
                      : <Ionicons name={doc.icon} size={22} color={statusColor(doc.status)} />
                    }
                  </Pressable>

                  {/* Info */}
                  <View style={styles.docInfo}>
                    <Text style={styles.docLabel}>{doc.label}</Text>
                    <Text style={styles.docHint}>{doc.hint}</Text>
                    <View style={styles.statusRow}>
                      <Ionicons name={statusIcon(doc.status)} size={13} color={statusColor(doc.status)} />
                      <Text style={[styles.statusText, { color: statusColor(doc.status) }]}>{statusLabel(doc.status)}</Text>
                      {doc.uploadedAt ? (
                        <Text style={styles.dateText}> · {formatDate(doc.uploadedAt)}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ gap: 6, alignItems: 'flex-end' }}>
                    {doc.status === 'uploaded' ? (
                      <>
                        <Pressable
                          onPress={() => { Haptics.selectionAsync(); setPicking(doc.id); }}
                          style={[styles.actionBtn, { backgroundColor: '#EBF0FF' }]}
                        >
                          <Ionicons name="refresh-outline" size={14} color={BRAND_BLUE} />
                          <Text style={[styles.actionBtnText, { color: BRAND_BLUE }]}>Replace</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(doc.id)}
                          style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
                        >
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Remove</Text>
                        </Pressable>
                      </>
                    ) : doc.status !== 'uploading' ? (
                      <Pressable
                        onPress={() => { Haptics.selectionAsync(); setPicking(doc.id); }}
                        style={[styles.actionBtn, { backgroundColor: statusBg(doc.status) }]}
                      >
                        <Ionicons name="cloud-upload-outline" size={14} color={statusColor(doc.status)} />
                        <Text style={[styles.actionBtnText, { color: statusColor(doc.status) }]}>Upload</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))
            )}

            {/* Why verify */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Why upload documents?</Text>
            {([
              { icon: 'shield-checkmark-outline' as const, text: 'Verified job seekers get a trust badge visible to all employers', color: BRAND_BLUE, bg: '#EBF0FF' },
              { icon: 'flash-outline' as const,            text: 'Employers prefer verified candidates for faster hiring decisions', color: ORANGE,    bg: '#FFF7ED' },
              { icon: 'lock-closed-outline' as const,      text: 'Your documents are stored securely and shared only with your consent', color: '#22C55E', bg: '#F0FDF4' },
            ]).map((item) => (
              <View key={item.icon} style={styles.reasonCard}>
                <View style={[styles.reasonIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.reasonText}>{item.text}</Text>
              </View>
            ))}

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Source picker modal */}
      <Modal visible={picking !== null} transparent animationType="slide" onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPicking(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Upload document</Text>
            <Text style={styles.modalSub}>Choose how to add your photo</Text>
            {([
              { label: 'Take a photo', sub: 'Use your camera', icon: 'camera-outline' as const, color: BRAND_BLUE, bg: '#EBF0FF', source: 'camera' as const },
              { label: 'Choose from gallery', sub: 'Pick from your phone', icon: 'image-outline' as const, color: '#22C55E', bg: '#F0FDF4', source: 'gallery' as const },
            ]).map((opt) => (
              <Pressable key={opt.source} onPress={() => picking && requestAndPick(picking, opt.source)} style={styles.modalOption}>
                <View style={[styles.modalOptionIcon, { backgroundColor: opt.bg }]}>
                  <Ionicons name={opt.icon} size={24} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionLabel}>{opt.label}</Text>
                  <Text style={styles.modalOptionSub}>{opt.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            ))}
            <Pressable onPress={() => setPicking(null)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Full-screen preview */}
      <Modal visible={previewUri !== null} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewUri(null)}>
          {previewLoading || previewUri === 'loading' ? (
            <ActivityIndicator size="large" color={WHITE} />
          ) : previewUri ? (
            <Image source={{ uri: previewUri }} style={{ width: '90%', height: '80%' }} resizeMode="contain" />
          ) : null}
          <View style={styles.previewClose}>
            <Ionicons name="close-circle" size={36} color={WHITE} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 },
  headerTitle: { color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 },
  headerSub: { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10 },
  statLabel: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' },
  body: { marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 12 },
  sectionTitle: { color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold' },
  docCard: { backgroundColor: WHITE, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  thumbnail: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  docInfo: { flex: 1, gap: 3 },
  docLabel: { color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  docHint: { color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' },
  dateText: { color: '#94A3B8', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular' },
  actionBtn: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' },
  reasonCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  reasonIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reasonText: { flex: 1, color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 14 },
  modalTitle: { color: '#0F172A', fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  modalSub: { color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: -8 },
  modalOption: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  modalOptionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalOptionLabel: { color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  modalOptionSub: { color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 },
  cancelBtn: { height: 48, backgroundColor: '#F1F5F9', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#475569', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  previewClose: { position: 'absolute', top: 52, right: 20 },
});
