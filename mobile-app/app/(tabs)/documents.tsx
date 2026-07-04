import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';

const BRAND_BLUE = '#1240C7';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

type DocStatus = 'not_uploaded' | 'pending' | 'verified';
interface DocItem { id: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; hint: string; status: DocStatus; imageUri?: string; }

const INITIAL_DOCS: DocItem[] = [
  { id: 'aadhaar',  label: 'Aadhaar Card',            icon: 'card-outline',    hint: 'Front and back photo of your Aadhaar card',  status: 'not_uploaded' },
  { id: 'pan',      label: 'PAN Card',                 icon: 'id-card-outline', hint: 'Photo of your PAN card',                     status: 'not_uploaded' },
  { id: 'dl',       label: "Driver's Licence",         icon: 'car-outline',     hint: 'Front side of your driving licence',          status: 'not_uploaded' },
  { id: 'passbook', label: 'Bank Passbook / Cheque',   icon: 'wallet-outline',  hint: 'First page of passbook or cancelled cheque', status: 'not_uploaded' },
];

function statusColor(s: DocStatus) { return s === 'verified' ? '#22C55E' : s === 'pending' ? ORANGE : BRAND_BLUE; }
function statusBg(s: DocStatus) { return s === 'verified' ? '#F0FDF4' : s === 'pending' ? '#FFF7ED' : '#EBF0FF'; }
function statusLabel(s: DocStatus) { return s === 'verified' ? 'Verified' : s === 'pending' ? 'Under review' : 'Not uploaded'; }
function statusIcon(s: DocStatus): React.ComponentProps<typeof Ionicons>['name'] { return s === 'verified' ? 'checkmark-circle' : s === 'pending' ? 'time-outline' : 'ellipse-outline'; }

export default function DocumentsTab() {
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const [picking, setPicking] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  async function requestAndPick(docId: string, source: 'camera' | 'gallery') {
    setPicking(null);
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission is required to take a photo.'); return; }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery permission is required to pick a photo.'); return; }
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3], mediaTypes: ['images'] });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'pending', imageUri: uri } : d));
  }

  const verified = docs.filter((d) => d.status === 'verified').length;
  const pending = docs.filter((d) => d.status === 'pending').length;
  const notUploaded = docs.filter((d) => d.status === 'not_uploaded').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Documents</Text>
            <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 4 }}>
              Upload ID proofs for employer verification
            </Text>
            {/* Stat row */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              {([
                { label: `${verified} Verified`, icon: 'checkmark-circle' as const, color: '#34D399', bg: 'rgba(52,211,153,0.20)' },
                { label: `${pending} Pending`,   icon: 'time-outline' as const,     color: ORANGE,     bg: 'rgba(255,140,0,0.20)'  },
                { label: `${notUploaded} To do`, icon: 'cloud-upload-outline' as const, color: '#93C5FD', bg: 'rgba(147,197,253,0.20)' },
              ]).map((s) => (
                <View key={s.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: s.bg, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10 }}>
                  <Ionicons name={s.icon} size={15} color={s.color} />
                  <Text style={{ color: s.color, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Body ───────────────────────────────────────────── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 12 }}>

            <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold' }}>Identity documents</Text>

            {docs.map((doc) => (
              <View key={doc.id} style={{ backgroundColor: WHITE, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                {/* Thumbnail */}
                <Pressable
                  style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: statusBg(doc.status), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                  onPress={doc.imageUri ? () => setPreviewUri(doc.imageUri!) : undefined}
                >
                  {doc.imageUri
                    ? <Image source={{ uri: doc.imageUri }} style={{ width: 52, height: 52 }} />
                    : <Ionicons name={doc.icon} size={22} color={statusColor(doc.status)} />
                  }
                </Pressable>

                {/* Info */}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>{doc.label}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 17 }}>{doc.hint}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <Ionicons name={statusIcon(doc.status)} size={13} color={statusColor(doc.status)} />
                    <Text style={{ color: statusColor(doc.status), fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{statusLabel(doc.status)}</Text>
                  </View>
                </View>

                {/* Action */}
                {doc.status === 'verified'
                  ? <Ionicons name="checkmark-circle" size={26} color="#22C55E" style={{ marginTop: 4 }} />
                  : (
                    <Pressable
                      onPress={() => { Haptics.selectionAsync(); setPicking(doc.id); }}
                      style={{ backgroundColor: statusBg(doc.status), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }}
                    >
                      <Ionicons name={doc.status === 'pending' ? 'refresh-outline' : 'cloud-upload-outline'} size={14} color={statusColor(doc.status)} />
                      <Text style={{ color: statusColor(doc.status), fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                        {doc.status === 'pending' ? 'Re-upload' : 'Upload'}
                      </Text>
                    </Pressable>
                  )
                }
              </View>
            ))}

            {/* Why verify */}
            <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 8 }}>Why verify documents?</Text>
            {([
              { icon: 'shield-checkmark-outline' as const, text: 'Verified job seekers get a trust badge visible to employers', color: BRAND_BLUE, bg: '#EBF0FF' },
              { icon: 'flash-outline' as const,             text: 'Employers prefer verified candidates for quick hiring',       color: ORANGE,     bg: '#FFF7ED' },
              { icon: 'lock-closed-outline' as const,       text: 'Document upload and verification coming soon',               color: '#22C55E',   bg: '#F0FDF4' },
            ]).map((item) => (
              <View key={item.icon} style={{ backgroundColor: WHITE, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={{ flex: 1, color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', lineHeight: 20 }}>{item.text}</Text>
              </View>
            ))}

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Source picker modal */}
      <Modal visible={picking !== null} transparent animationType="slide" onRequestClose={() => setPicking(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setPicking(null)}>
          <View style={{ backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 14 }}>
            <Text style={{ color: '#0F172A', fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>Upload document</Text>
            <Text style={{ color: '#64748B', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: -8 }}>Choose how to add your photo</Text>

            {([
              { label: 'Take a photo', sub: 'Use your camera to photograph the document', icon: 'camera-outline' as const, color: BRAND_BLUE, bg: '#EBF0FF', source: 'camera' as const },
              { label: 'Choose from gallery', sub: 'Pick an existing photo from your phone', icon: 'image-outline' as const, color: '#22C55E', bg: '#F0FDF4', source: 'gallery' as const },
            ]).map((opt) => (
              <Pressable key={opt.source} onPress={() => picking && requestAndPick(picking, opt.source)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: opt.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={opt.icon} size={24} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>{opt.label}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{opt.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            ))}

            <Pressable onPress={() => setPicking(null)} style={{ height: 48, backgroundColor: '#F1F5F9', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#475569', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Full-screen preview */}
      <Modal visible={previewUri !== null} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setPreviewUri(null)}>
          {previewUri ? <Image source={{ uri: previewUri }} style={{ width: '90%', height: '80%' }} resizeMode="contain" /> : null}
          <View style={{ position: 'absolute', top: 52, right: 20 }}>
            <Ionicons name="close-circle" size={36} color={WHITE} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
