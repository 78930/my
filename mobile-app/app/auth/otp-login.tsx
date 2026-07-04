import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Spacer } from '../../components/ui/Spacer';
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
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not send OTP. Check your connection and try again.'
      );
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
      setError(err instanceof ApiError ? err.message : 'Invalid OTP. Please try again.');
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
        <Card>
          <Text variant="h2">Enter OTP</Text>
          <Spacer size="xs" />
          <Text variant="body" color="secondary">
            {`A one-time code was sent to ${phone}. Enter it below.`}
          </Text>
          <Spacer size="lg" />

          <Input
            label="One-time code"
            placeholder="6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            autoCapitalize="none"
            leftIcon="keypad-outline"
          />

          {error ? (
            <>
              <Spacer size="md" />
              <Text variant="label" color="error">{error}</Text>
            </>
          ) : null}

          <Spacer size="lg" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              label="Change number"
              onPress={() => {
                setStep('phone');
                setOtp('');
                setError('');
                setCooldown(0);
              }}
              variant="ghost"
              style={{ flex: 1 }}
            />
            <Button
              label="Verify OTP"
              onPress={handleVerifyOtp}
              variant="primary"
              loading={isSubmitting}
              style={{ flex: 1 }}
            />
          </View>

          <Spacer size="md" />
          <Pressable
            onPress={handleResend}
            disabled={cooldown > 0 || sending}
            style={{ alignItems: 'center' }}
          >
            <Text variant="label" color={cooldown > 0 || sending ? 'tertiary' : 'brand'}>
              {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </Text>
          </Pressable>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Text variant="h2">Login with OTP</Text>
        <Spacer size="xs" />
        <Text variant="body" color="secondary">
          Enter your registered phone number. We'll send you a one-time code.
        </Text>
        <Spacer size="lg" />

        <Input
          label="Mobile number"
          placeholder="10-digit mobile number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
          leftIcon="call-outline"
        />

        {error ? (
          <>
            <Spacer size="md" />
            <Text variant="label" color="error">{error}</Text>
          </>
        ) : null}

        <Spacer size="lg" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label="Back"
            onPress={() => router.back()}
            variant="ghost"
            style={{ flex: 1 }}
          />
          <Button
            label="Send OTP"
            onPress={handleSendOtp}
            variant="primary"
            loading={sending}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    </Screen>
  );
}
