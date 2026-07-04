import React from 'react';
import { Text, View } from 'react-native';

const SIZES = { sm: 32, md: 44, lg: 56 } as const;
const FONT_SIZES = { sm: 12, md: 16, lg: 20 } as const;

const PALETTE = [
  '#6D5AE6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
];

function deriveColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Avatar({ name, size = 'md', color }: AvatarProps) {
  const dim = SIZES[size];
  const bg = color ?? deriveColor(name);

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: FONT_SIZES[size],
          fontFamily: 'PlusJakartaSans_700Bold',
          color: '#FFFFFF',
        }}
      >
        {toInitials(name)}
      </Text>
    </View>
  );
}
