import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { SpacingKey } from '../../theme/tokens';

export interface SpacerProps {
  size?: SpacingKey;
  flex?: boolean;
  horizontal?: boolean;
}

export function Spacer({ size, flex = false, horizontal = false }: SpacerProps) {
  const { spacing } = useTheme();

  if (flex) return <View style={{ flex: 1 }} />;

  const dim = size != null ? spacing[size] : 0;
  return (
    <View
      style={horizontal ? { width: dim } : { height: dim }}
    />
  );
}
