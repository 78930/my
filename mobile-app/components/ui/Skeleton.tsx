import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.shimmerBase,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Composite presets ─────────────────────────────────────────────────────────

export function SkeletonJobCard() {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: 16,
        padding: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton height={18} width="70%" />
      <Skeleton height={14} width="45%" />
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
        <Skeleton height={28} width={80} radius={999} />
        <Skeleton height={28} width={80} radius={999} />
        <Skeleton height={28} width={60} radius={999} />
      </View>
    </View>
  );
}

export function SkeletonWorkerCard() {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: 16,
        padding: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}
      >
        <Skeleton width={44} height={44} radius={22} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Skeleton height={16} width="60%" />
          <Skeleton height={13} width="40%" />
        </View>
      </View>
    </View>
  );
}

export function SkeletonStatRow() {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flex: 1, gap: spacing.sm }}>
          <Skeleton height={36} radius={12} />
          <Skeleton height={14} width="80%" />
        </View>
      ))}
    </View>
  );
}
