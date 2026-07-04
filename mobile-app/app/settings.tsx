import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/ui/Text';
import { languageLabels, setAppLanguage, supportedLanguages } from '../lib/language';

const BRAND_BLUE = '#1240C7';
const WHITE = '#FFFFFF';

const LANG_META: Record<string, { native: string; sub: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  en: { native: 'English', sub: 'English', icon: 'language-outline' },
  hi: { native: 'हिंदी',   sub: 'Hindi',   icon: 'chatbubble-ellipses-outline' },
  te: { native: 'తెలుగు', sub: 'Telugu',  icon: 'chatbubble-outline' },
};

export default function SettingsScreen() {
  const { i18n } = useTranslation();

  const currentLanguage = supportedLanguages.includes(i18n.language as (typeof supportedLanguages)[number])
    ? (i18n.language as (typeof supportedLanguages)[number])
    : 'en';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

          {/* ── Blue header ── */}
          <View style={{ backgroundColor: BRAND_BLUE, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.back(); }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back-outline" size={20} color={WHITE} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: WHITE, fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 }}>Settings</Text>
                <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>Preferences & app info</Text>
              </View>
            </View>
          </View>

          {/* ── White body ── */}
          <View style={{ marginTop: -26, backgroundColor: '#F8FAFC', borderTopLeftRadius: 26, borderTopRightRadius: 26, flex: 1, padding: 20, gap: 20 }}>

            {/* Language section */}
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBF0FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="language-outline" size={18} color={BRAND_BLUE} />
                </View>
                <View>
                  <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold' }}>Language</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>Choose the app display language</Text>
                </View>
              </View>

              {supportedLanguages.map((lang) => {
                const active = currentLanguage === lang;
                const meta = LANG_META[lang];
                return (
                  <Pressable
                    key={lang}
                    onPress={() => { Haptics.selectionAsync(); setAppLanguage(lang); }}
                    style={{
                      backgroundColor: active ? '#EBF0FF' : WHITE,
                      borderRadius: 18, padding: 16,
                      flexDirection: 'row', alignItems: 'center', gap: 14,
                      borderWidth: 2, borderColor: active ? BRAND_BLUE : '#E2E8F0',
                    }}
                  >
                    <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: active ? BRAND_BLUE : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={meta?.icon ?? 'language-outline'} size={22} color={active ? WHITE : '#64748B'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: active ? BRAND_BLUE : '#0F172A', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>{meta?.native ?? languageLabels[lang]}</Text>
                      <Text style={{ color: active ? '#5B8DFF' : '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>{meta?.sub ?? lang.toUpperCase()}</Text>
                    </View>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: active ? BRAND_BLUE : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                      {active
                        ? <Ionicons name="checkmark" size={16} color={WHITE} />
                        : <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#CBD5E1' }} />
                      }
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />

            {/* About section */}
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="information-circle-outline" size={18} color="#22C55E" />
                </View>
                <Text style={{ color: '#0F172A', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold' }}>About</Text>
              </View>

              {([
                { icon: 'business-outline' as const,         iconBg: '#EBF0FF', iconColor: BRAND_BLUE, label: 'Sketu',   value: 'Industrial hiring platform for Hyderabad' },
                { icon: 'code-slash-outline' as const,       iconBg: '#FFF7ED', iconColor: '#FF8C00',  label: 'Version', value: '1.0.0' },
                { icon: 'shield-checkmark-outline' as const, iconBg: '#F0FDF4', iconColor: '#22C55E',  label: 'Privacy', value: 'Your data stays secure and private' },
              ]).map((item) => (
                <View key={item.label} style={{ backgroundColor: WHITE, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: item.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0F172A', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>{item.label}</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2, lineHeight: 18 }}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ height: 16 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
