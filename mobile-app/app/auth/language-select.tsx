import React, { useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '../../components/ui/Text';
import { AppLanguage, languageLabels, setAppLanguage, supportedLanguages } from '../../lib/language';

const BRAND_BLUE = '#1240C7';
const ICON_BLUE = '#5B8DFF';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';

const LANG_META: Record<AppLanguage, { native: string; sub: string }> = {
  en: { native: 'English',  sub: 'Continue in English' },
  hi: { native: 'हिंदी',    sub: 'हिंदी में जारी रखें' },
  te: { native: 'తెలుగు',   sub: 'తెలుగులో కొనసాగించు' },
};

// ─── S logo mark ──────────────────────────────────────────────────────────────
function SketuMark({ size = 52 }: { size?: number }) {
  const bw = Math.round(size * 0.12);
  const arc = Math.round(size * 0.70);
  const dot = Math.round(bw * 1.5);
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: arc, height: arc, borderRadius: arc / 2, borderWidth: bw, borderColor: ICON_BLUE, borderRightColor: 'transparent' }} />
      <View style={{ position: 'absolute', top: arc / 2 - dot / 2, left: arc - bw / 2 - dot / 2, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: ORANGE }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: arc, height: arc, borderRadius: arc / 2, borderWidth: bw, borderColor: ORANGE, borderLeftColor: 'transparent' }} />
    </View>
  );
}

// ─── Language card ────────────────────────────────────────────────────────────
function LangCard({ lang, active, onSelect }: { lang: AppLanguage; active: boolean; onSelect: () => void }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const meta = LANG_META[lang];

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 2 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onSelect(); }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          backgroundColor: active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
          borderRadius: 18,
          borderWidth: active ? 2 : 1.5,
          borderColor: active ? WHITE : 'rgba(255,255,255,0.25)',
          paddingVertical: 18,
          paddingHorizontal: 20,
        }}
      >
        {/* Left: language icon area */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: active ? WHITE : 'rgba(255,255,255,0.14)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: active ? BRAND_BLUE : WHITE, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
            {meta.native.charAt(0)}
          </Text>
        </View>

        {/* Center: labels */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: WHITE, fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.3 }}>
            {meta.native}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 }}>
            {meta.sub}
          </Text>
        </View>

        {/* Right: check */}
        {active ? (
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={16} color={BRAND_BLUE} />
          </View>
        ) : (
          <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' }} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LanguageSelectScreen() {
  const [selected, setSelected] = useState<AppLanguage>('en');
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setAppLanguage(selected);
    router.replace('/auth/welcome');
  }

  return (
    <View style={{ flex: 1, backgroundColor: BRAND_BLUE }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>

          {/* Brand */}
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <SketuMark size={60} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 30, fontFamily: 'PlusJakartaSans_800ExtraBold', color: WHITE, letterSpacing: -1 }}>Ske</Text>
              <Text style={{ fontSize: 30, fontFamily: 'PlusJakartaSans_800ExtraBold', color: ORANGE, letterSpacing: -1 }}>tu</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={{ marginBottom: 28, gap: 6 }}>
            <Text style={{ color: WHITE, fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.5 }}>
              Choose your language
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 21 }}>
              Pick the language you're most comfortable with. You can change it later in Settings.
            </Text>
          </View>

          {/* Language cards */}
          <View style={{ gap: 14 }}>
            {supportedLanguages.map((lang) => (
              <LangCard
                key={lang}
                lang={lang}
                active={selected === lang}
                onSelect={() => setSelected(lang)}
              />
            ))}
          </View>

          <View style={{ flex: 1 }} />

          {/* Continue button */}
          <Pressable
            onPress={handleContinue}
            disabled={saving}
            style={{
              height: 56,
              backgroundColor: saving ? 'rgba(255,255,255,0.55)' : WHITE,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: BRAND_BLUE, fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
              Continue
            </Text>
            <Ionicons name="arrow-forward" size={18} color={BRAND_BLUE} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
