import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { UserType } from '../../types';

const BRAND_BLUE = '#1240C7';
const ICON_BLUE = '#5B8DFF';
const ORANGE = '#FF8C00';
const WHITE = '#FFFFFF';
const RESEND_COOLDOWN = 30;

type Role = 'worker' | 'factory';
type LoginMethod = 'name' | 'otp';
type OtpStep = 'idle' | 'otp_sent';

// ─── S logo mark ──────────────────────────────────────────────────────────────
function SketuMark({ size = 48 }: { size?: number }) {
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

// ─── Shared input field ───────────────────────────────────────────────────────
function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  letterSpacing,
  prefix,
  suffix,
  focused,
  onFocus,
  onBlur,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'words';
  maxLength?: number;
  letterSpacing?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: focused ? BRAND_BLUE : '#E2E8F0',
        height: 52,
        paddingHorizontal: 14,
        gap: 10,
      }}
    >
      <Ionicons name={icon} size={17} color={focused ? BRAND_BLUE : '#94A3B8'} />
      {prefix}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          flex: 1,
          fontSize: 15,
          fontFamily: 'PlusJakartaSans_500Medium',
          color: '#1E293B',
          letterSpacing: letterSpacing ?? 0,
          paddingVertical: 0,
        }}
      />
      {suffix}
    </View>
  );
}

// ─── Animated sliding tab indicator ──────────────────────────────────────────
function TabBar<T extends string>({
  options,
  active,
  onSelect,
}: {
  options: { value: T; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[];
  active: T;
  onSelect: (v: T) => void;
}) {
  const idx = options.findIndex((o) => o.value === active);
  const anim = useRef(new Animated.Value(idx)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: idx, useNativeDriver: false, speed: 40, bounciness: 0 }).start();
  }, [idx]);

  const pct = (100 / options.length).toFixed(1) + '%';

  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, position: 'relative', height: 46 }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          width: pct as any,
          left: anim.interpolate({ inputRange: options.map((_, i) => i), outputRange: options.map((_, i) => `${(i * 100) / options.length + 2}%`) as any }),
          backgroundColor: BRAND_BLUE,
          borderRadius: 11,
          shadowColor: BRAND_BLUE,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 3,
        }}
      />
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => { Haptics.selectionAsync(); onSelect(opt.value); }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 }}
        >
          <Ionicons name={opt.icon} size={14} color={active === opt.value ? WHITE : '#64748B'} />
          <Text style={{ color: active === opt.value ? WHITE : '#64748B', fontFamily: active === opt.value ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium', fontSize: 13 }}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Social button ────────────────────────────────────────────────────────────
function SocialButton({ icon, label, color, bg, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 5 }}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 3 }).start()}
        style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: bg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={icon} size={23} color={color} />
      </Pressable>
      <Text variant="caption" style={{ color: '#64748B', fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium' }}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const { signIn, requestOtp, signInWithOtp } = useAuth();

  const [role, setRole] = useState<Role>('worker');
  const [method, setMethod] = useState<LoginMethod>('name');

  // Name + Number fields
  const [name, setName] = useState('');
  const [namePhone, setNamePhone] = useState('');

  // OTP fields
  const [otpPhone, setOtpPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('idle');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Focus tracking
  const [focused, setFocused] = useState('');

  // OTP field slide-in
  const otpOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    Animated.timing(otpOpacity, { toValue: otpStep !== 'idle' ? 1 : 0, duration: 240, useNativeDriver: true }).start();
  }, [otpStep]);

  // ── Name + Number login ──
  async function handleNameLogin() {
    setError('');
    if (name.trim().length < 2) { setError('Please enter your full name.'); return; }
    if (namePhone.trim().replace(/\D/g, '').length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    setLoading(true);
    try {
      await signIn({ role: role as UserType, name: name.trim(), phone: namePhone.trim() });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── OTP login ──
  async function handleSendOtp() {
    setError('');
    const trimmed = otpPhone.trim().replace(/\D/g, '');
    if (trimmed.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    setSending(true);
    try {
      await requestOtp({ phone: trimmed });
      setOtpStep('otp_sent');
      setCooldown(RESEND_COOLDOWN);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || sending) return;
    setOtp('');
    setError('');
    await handleSendOtp();
  }

  async function handleOtpLogin() {
    setError('');
    if (otpStep === 'idle') { await handleSendOtp(); return; }
    if (otp.trim().length < 4) { setError('Please enter the OTP sent to your number.'); return; }
    setLoading(true);
    try {
      await signInWithOtp({ phone: otpPhone.trim().replace(/\D/g, ''), otp: otp.trim() });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleMethodChange(m: LoginMethod) {
    setMethod(m);
    setError('');
    setOtpStep('idle');
    setOtp('');
    setCooldown(0);
  }

  const isLoading = loading || sending;
  const otpCtaLabel = otpStep === 'idle' ? 'Send OTP' : 'Login / Continue';

  const ROLE_OPTIONS = [
    { value: 'worker' as Role,  label: 'Job Seeker', icon: 'person-outline' as const },
    { value: 'factory' as Role, label: 'Employer',   icon: 'business-outline' as const },
  ];
  const METHOD_OPTIONS = [
    { value: 'name' as LoginMethod, label: 'Name & Number', icon: 'person-circle-outline' as const },
    { value: 'otp'  as LoginMethod, label: 'OTP Login',     icon: 'shield-checkmark-outline' as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ─────────────────────────────────────────── */}
            <View
              style={{
                backgroundColor: BRAND_BLUE,
                paddingHorizontal: 24,
                paddingTop: 20,
                paddingBottom: 48,
                alignItems: 'center',
                gap: 10,
              }}
            >
              <SketuMark size={56} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 0 }}>
                <Text style={{ fontSize: 30, fontFamily: 'PlusJakartaSans_800ExtraBold', color: WHITE, letterSpacing: -0.8 }}>Ske</Text>
                <Text style={{ fontSize: 30, fontFamily: 'PlusJakartaSans_800ExtraBold', color: ORANGE, letterSpacing: -0.8 }}>tu</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>
                Login to continue your journey
              </Text>
            </View>

            {/* ── Card ───────────────────────────────────────────── */}
            <View
              style={{
                marginTop: -26,
                marginHorizontal: 0,
                backgroundColor: WHITE,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                flex: 1,
                paddingHorizontal: 20,
                paddingTop: 28,
                paddingBottom: 24,
                gap: 18,
              }}
            >
              {/* Welcome text */}
              <View style={{ gap: 3 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text variant="h1" style={{ color: '#0F172A', fontSize: 22 }}>Welcome to </Text>
                  <Text variant="h1" style={{ color: BRAND_BLUE, fontSize: 22 }}>Sketu</Text>
                </View>
                <Text variant="body" style={{ color: '#64748B', fontSize: 13 }}>
                  Choose how you'd like to log in below
                </Text>
              </View>

              {/* Role tabs */}
              <TabBar options={ROLE_OPTIONS} active={role} onSelect={setRole} />

              {/* Login method tabs */}
              <TabBar options={METHOD_OPTIONS} active={method} onSelect={handleMethodChange} />

              {/* ── Name & Number form ─────────────────────────── */}
              {method === 'name' ? (
                <View style={{ gap: 14 }}>
                  <Field
                    icon="person-outline"
                    placeholder="Your full name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    focused={focused === 'name'}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused('')}
                  />
                  <Field
                    icon="call-outline"
                    placeholder="Mobile number"
                    value={namePhone}
                    onChangeText={setNamePhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    focused={focused === 'namePhone'}
                    onFocus={() => setFocused('namePhone')}
                    onBlur={() => setFocused('')}
                    prefix={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#E2E8F0' }}>
                        <Text style={{ color: '#1E293B', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>+91</Text>
                        <Ionicons name="chevron-down" size={12} color="#94A3B8" />
                      </View>
                    }
                  />

                  {error ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                      <Text variant="label" color="error" style={{ flex: 1 }}>{error}</Text>
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleNameLogin(); }}
                    disabled={isLoading}
                    style={{ height: 52, backgroundColor: isLoading ? '#93A5E0' : BRAND_BLUE, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                  >
                    {isLoading ? <ActivityIndicator size="small" color={WHITE} /> : (
                      <>
                        <Text style={{ color: WHITE, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>Login</Text>
                        <Ionicons name="arrow-forward" size={16} color={WHITE} />
                      </>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {/* ── OTP form ───────────────────────────────────── */}
              {method === 'otp' ? (
                <View style={{ gap: 14 }}>
                  <Field
                    icon="call-outline"
                    placeholder="Mobile number"
                    value={otpPhone}
                    onChangeText={(v) => {
                      setOtpPhone(v);
                      if (otpStep !== 'idle') { setOtpStep('idle'); setOtp(''); setCooldown(0); }
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    focused={focused === 'otpPhone'}
                    onFocus={() => setFocused('otpPhone')}
                    onBlur={() => setFocused('')}
                    prefix={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#E2E8F0' }}>
                        <Text style={{ color: '#1E293B', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>+91</Text>
                        <Ionicons name="chevron-down" size={12} color="#94A3B8" />
                      </View>
                    }
                  />

                  {/* OTP field — slides in after OTP sent */}
                  <Animated.View
                    style={{
                      opacity: otpOpacity,
                      transform: [{ translateY: otpOpacity.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
                      pointerEvents: (otpStep !== 'idle' ? 'auto' : 'none') as 'auto' | 'none',
                      gap: 6,
                    }}
                  >
                    <Field
                      icon="shield-checkmark-outline"
                      placeholder="Enter OTP"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      letterSpacing={6}
                      focused={focused === 'otp'}
                      onFocus={() => setFocused('otp')}
                      onBlur={() => setFocused('')}
                      suffix={
                        <Pressable onPress={handleResend} disabled={cooldown > 0 || sending}>
                          <Text style={{ color: cooldown > 0 || sending ? '#94A3B8' : BRAND_BLUE, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                            {sending ? 'Sending…' : cooldown > 0 ? `${cooldown}s` : 'Resend'}
                          </Text>
                        </Pressable>
                      }
                    />
                    {otpStep !== 'idle' && otpPhone.length >= 10 ? (
                      <Text variant="caption" style={{ color: '#64748B', marginLeft: 4, fontSize: 12 }}>
                        {`OTP sent to +91 ${otpPhone.slice(-10)}`}
                      </Text>
                    ) : null}
                  </Animated.View>

                  {error ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                      <Text variant="label" color="error" style={{ flex: 1 }}>{error}</Text>
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleOtpLogin(); }}
                    disabled={isLoading}
                    style={{ height: 52, backgroundColor: isLoading ? '#93A5E0' : BRAND_BLUE, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                  >
                    {isLoading ? <ActivityIndicator size="small" color={WHITE} /> : (
                      <>
                        <Text style={{ color: WHITE, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>{otpCtaLabel}</Text>
                        <Ionicons name={otpStep === 'idle' ? 'send-outline' : 'arrow-forward'} size={16} color={WHITE} />
                      </>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {/* Sign-up link */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                <Text variant="body" style={{ color: '#64748B', fontSize: 13 }}>New to Sketu?</Text>
                <Pressable onPress={() => router.push({ pathname: '/auth/signup', params: { type: role } })}>
                  <Text style={{ color: BRAND_BLUE, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                    Create an account
                  </Text>
                </Pressable>
              </View>

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                <Text variant="caption" style={{ color: '#94A3B8', fontSize: 12 }}>or continue with</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              </View>

              {/* Social buttons */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28 }}>
                <SocialButton icon="logo-google"   label="Google"   color="#EA4335" bg="#FEF2F2" onPress={() => Alert.alert('Google login',   'Coming soon!')} />
                <SocialButton icon="logo-whatsapp" label="WhatsApp" color="#25D366" bg="#F0FDF4" onPress={() => Alert.alert('WhatsApp login', 'Coming soon!')} />
                <SocialButton icon="logo-facebook" label="Facebook" color="#1877F2" bg="#EFF6FF" onPress={() => Alert.alert('Facebook login', 'Coming soon!')} />
              </View>

              {/* Terms */}
              <Text
                variant="caption"
                style={{ color: '#94A3B8', textAlign: 'center', lineHeight: 18, fontSize: 11 }}
              >
                {'By continuing, you agree to our '}
                <Text variant="caption" style={{ color: BRAND_BLUE, fontSize: 11 }} onPress={() => Alert.alert('Terms', 'Terms & Conditions coming soon.')}>
                  Terms & Conditions
                </Text>
                {' and '}
                <Text variant="caption" style={{ color: BRAND_BLUE, fontSize: 11 }} onPress={() => Alert.alert('Privacy', 'Privacy Policy coming soon.')}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
