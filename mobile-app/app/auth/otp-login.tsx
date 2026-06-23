import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { InputField } from '../../components/ui/InputField';
import { Screen } from '../../components/ui/Screen';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

const RESEND_COOLDOWN = 30;
type Step = 'phone' | 'otp';

export default function OtpLoginScreen() {
  const { requestOtp, signInWithOtp, isSubmitting } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    setError('');
    const trimmedPhone = phone.trim().replace(/\D/g, '');
    if (trimmedPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSending(true);
    try {
      await requestOtp({ phone: trimmedPhone });
      setStep('otp');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not send OTP. Check your connection and try again.');
      }
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length < 4) {
      setError('Please enter the OTP sent to your phone.');
      return;
    }

    try {
      await signInWithOtp({ phone: phone.trim().replace(/\D/g, ''), otp: trimmedOtp });
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    }
  }

  async function handleResend() {
    if (cooldown > 0 || sending) return;
    setOtp('');
    setError('');
    await handleSendOtp();
  }

  if (step === 'otp') {
    return (
      <Screen>
        <SectionCard
          title="Enter OTP"
          subtitle={`A one-time code was sent to ${phone}. Enter it below.`}
        >
          <InputField
            icon="keypad-outline"
            placeholder="6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            autoCapitalize="none"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={styles.backButton}
              onPress={() => { setStep('phone'); setOtp(''); setError(''); setCooldown(0); }}
            >
              <Text style={styles.backText}>Change number</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryText}>
                {isSubmitting ? 'Verifying…' : 'Verify OTP'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.resendLink, (cooldown > 0 || sending) && styles.resendDisabled]}
            onPress={handleResend}
            disabled={cooldown > 0 || sending}
          >
            <Text style={[styles.resendText, (cooldown > 0 || sending) && styles.resendTextDisabled]}>
              {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </Text>
          </Pressable>
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionCard
        title="Login with OTP"
        subtitle="Enter your registered phone number. We'll send you a one-time code."
      >
        <InputField
          icon="call-outline"
          placeholder="10-digit mobile number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, sending && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={sending}
          >
            <Text style={styles.primaryText}>
              {sending ? 'Sending…' : 'Send OTP'}
            </Text>
          </Pressable>
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  backButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backText: { color: colors.text, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.55 },
  primaryText: { color: colors.textInverse, fontWeight: '800' },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 999,
    padding: 12,
  },
  errorText: { color: '#b91c1c', lineHeight: 20 },
  resendLink: { alignItems: 'center', marginTop: 4 },
  resendDisabled: { opacity: 0.45 },
  resendText: { color: colors.primary, fontWeight: '700' },
  resendTextDisabled: { color: colors.textMuted },
});
