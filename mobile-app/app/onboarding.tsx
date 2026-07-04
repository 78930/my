import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');

const BG = '#1240C7';
const ORANGE = '#FF8C00';
const ICON_BLUE = '#5B8DFF';
const WHITE = '#FFFFFF';

// ─── S logo mark built from two arc Views ────────────────────────────────────
function SketuMark({ size = 88 }: { size?: number }) {
  const bw = Math.round(size * 0.12);
  const arc = Math.round(size * 0.70);
  const dotSize = Math.round(bw * 1.5);

  return (
    <View style={{ width: size, height: size }}>
      {/* Top blue 3/4 ring — opens to the right (C-shape) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: arc,
          height: arc,
          borderRadius: arc / 2,
          borderWidth: bw,
          borderColor: ICON_BLUE,
          borderRightColor: 'transparent',
        }}
      />
      {/* Orange dot at the junction of the two arcs */}
      <View
        style={{
          position: 'absolute',
          top: arc / 2 - dotSize / 2,
          left: arc - bw / 2 - dotSize / 2,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: ORANGE,
        }}
      />
      {/* Bottom orange 3/4 ring — opens to the left (reverse C) */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: arc,
          height: arc,
          borderRadius: arc / 2,
          borderWidth: bw,
          borderColor: ORANGE,
          borderLeftColor: 'transparent',
        }}
      />
    </View>
  );
}

// ─── "Sketu" wordmark ─────────────────────────────────────────────────────────
function SketuText({ size = 42 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text
        style={{
          fontSize: size,
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          color: WHITE,
          letterSpacing: -1,
        }}
      >
        Ske
      </Text>
      <Text
        style={{
          fontSize: size,
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          color: ORANGE,
          letterSpacing: -1,
        }}
      >
        tu
      </Text>
    </View>
  );
}

// ─── Worker silhouette cards for slide 1 ─────────────────────────────────────
const WORKERS = [
  { icon: 'construct-outline' as const, label: 'Operator',   helmetColor: ORANGE },
  { icon: 'hammer-outline'    as const, label: 'Fabricator', helmetColor: ICON_BLUE },
  { icon: 'settings-outline'  as const, label: 'Technician', helmetColor: ORANGE },
  { icon: 'build-outline'     as const, label: 'Fitter',     helmetColor: ICON_BLUE },
] as const;

function HeroWorkers() {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {WORKERS.map((w, i) => (
        <View
          key={w.label}
          style={{
            alignItems: 'center',
            transform: [{ translateY: i % 2 === 0 ? 0 : -22 }],
          }}
        >
          {/* Hard-hat */}
          <View
            style={{
              width: 40,
              height: 18,
              backgroundColor: w.helmetColor,
              borderRadius: 20,
              marginBottom: -6,
              zIndex: 1,
            }}
          />
          {/* Body card */}
          <View
            style={{
              width: 68,
              height: 108,
              backgroundColor:
                i % 2 === 0
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,140,0,0.18)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Ionicons name={w.icon} size={30} color="rgba(255,255,255,0.9)" />
            <Text
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 9,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                textAlign: 'center',
              }}
            >
              {w.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Slide 1: hero ────────────────────────────────────────────────────────────
function HeroSlide() {
  return (
    <View style={{ width: W, flex: 1 }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          paddingTop: 12,
          paddingHorizontal: 24,
        }}
      >
        {/* Brand */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <SketuMark size={90} />
          <SketuText size={40} />
        </View>

        <View style={{ height: 10 }} />

        <Text
          style={{
            color: 'rgba(255,255,255,0.88)',
            fontSize: 18,
            fontFamily: 'PlusJakartaSans_500Medium',
            textAlign: 'center',
            lineHeight: 27,
          }}
        >
          Bridging Skilled Talent{'\n'}with Employers
        </Text>

        {/* Workers hero */}
        <View
          style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 110 }}
        >
          <HeroWorkers />
        </View>
      </View>

      {/* White wave + tagline */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: -28,
          right: -28,
          height: 110,
          backgroundColor: WHITE,
          borderTopLeftRadius: 120,
          borderTopRightRadius: 120,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 14,
        }}
      >
        <Text
          style={{
            color: '#0F172A',
            fontSize: 22,
            fontFamily: 'PlusJakartaSans_700Bold',
            letterSpacing: -0.3,
          }}
        >
          Find Jobs. Build Future.
        </Text>
      </View>
    </View>
  );
}

// ─── Slides 2 + 3: feature ────────────────────────────────────────────────────
type FeatureItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
};

type SlideConfig = {
  key: string;
  hero: boolean;
  mainIcon?: React.ComponentProps<typeof Ionicons>['name'];
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
};

const SLIDES: SlideConfig[] = [
  { key: '1', hero: true },
  {
    key: '2',
    hero: false,
    mainIcon: 'briefcase',
    title: 'Find Jobs\nNear You',
    subtitle:
      'Browse industrial job openings by area, role, pay and shift. Apply in seconds.',
    features: [
      { icon: 'location-outline', text: 'Openings in your industrial area' },
      { icon: 'cash-outline', text: 'Know the salary before applying' },
      { icon: 'time-outline', text: 'Day, Night & Rotational shifts' },
    ],
  },
  {
    key: '3',
    hero: false,
    mainIcon: 'people',
    title: 'Hire Skilled\nTalent Fast',
    subtitle:
      'Search verified job seekers, shortlist the best, and extend hire offers in minutes.',
    features: [
      { icon: 'shield-checkmark-outline', text: 'Verified job seeker profiles' },
      { icon: 'star-outline', text: 'Shortlist & track candidates' },
      { icon: 'checkmark-circle-outline', text: 'Send hire offers instantly' },
    ],
  },
];

function FeatureSlide({ slide }: { slide: SlideConfig }) {
  return (
    <View
      style={{
        width: W,
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingTop: 24,
      }}
    >
      {/* Large icon circle */}
      <View
        style={{
          width: 130,
          height: 130,
          borderRadius: 65,
          backgroundColor: 'rgba(255,255,255,0.16)',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.22)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 30,
        }}
      >
        <Ionicons name={slide.mainIcon!} size={62} color={WHITE} />
      </View>

      {/* Title */}
      <Text
        style={{
          color: WHITE,
          fontSize: 32,
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          textAlign: 'center',
          lineHeight: 40,
          letterSpacing: -0.5,
          marginBottom: 14,
        }}
      >
        {slide.title}
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          color: 'rgba(255,255,255,0.78)',
          fontSize: 15,
          fontFamily: 'PlusJakartaSans_400Regular',
          textAlign: 'center',
          lineHeight: 23,
          marginBottom: 32,
        }}
      >
        {slide.subtitle}
      </Text>

      {/* Feature rows */}
      {slide.features ? (
        <View style={{ gap: 12, width: '100%' }}>
          {slide.features.map((f) => (
            <View
              key={f.text}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: 'rgba(255,255,255,0.11)',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.10)',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={f.icon} size={19} color={WHITE} />
              </View>
              <Text
                style={{
                  flex: 1,
                  color: WHITE,
                  fontSize: 15,
                  fontFamily: 'PlusJakartaSans_500Medium',
                }}
              >
                {f.text}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color={ORANGE} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  async function finish() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await SecureStore.setItemAsync('onboarding_v2_seen', '1');
    } catch {
      // non-fatal
    }
    router.replace('/auth/language-select');
  }

  function handleNext() {
    Haptics.selectionAsync();
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finish();
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Skip */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 20,
            paddingTop: 4,
          }}
        >
          <Pressable
            onPress={finish}
            style={{ paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_600SemiBold',
              }}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Slide list */}
        <FlatList
          ref={flatRef}
          data={SLIDES}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) =>
            item.hero ? <HeroSlide /> : <FeatureSlide slide={item} />
          }
          style={{ flex: 1 }}
        />

        {/* Bottom: dots + button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingBottom: 10,
            paddingTop: 10,
          }}
        >
          {/* Dot indicators */}
          <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 7,
                  width: i === activeIndex ? 26 : 7,
                  borderRadius: 4,
                  backgroundColor:
                    i === activeIndex
                      ? ORANGE
                      : 'rgba(255,255,255,0.30)',
                }}
              />
            ))}
          </View>

          {/* Next / Get Started */}
          <Pressable
            onPress={handleNext}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: isLast
                ? ORANGE
                : 'rgba(255,255,255,0.16)',
              borderRadius: 999,
              paddingVertical: 13,
              paddingHorizontal: 22,
              borderWidth: isLast ? 0 : 1,
              borderColor: 'rgba(255,255,255,0.20)',
            }}
          >
            <Text
              style={{
                color: WHITE,
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_700Bold',
                letterSpacing: 0.2,
              }}
            >
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={isLast ? 'rocket-outline' : 'arrow-forward'}
              size={17}
              color={WHITE}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
