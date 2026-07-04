import React, { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  leftElement,
  rightElement,
  showChevron,
  onPress,
}: ListItemProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.99,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function pressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 2,
    }).start();
  }

  function handlePress() {
    Haptics.selectionAsync();
    onPress?.();
  }

  const shouldShowChevron = showChevron ?? onPress != null;

  const left =
    leftElement ??
    (leftIcon ? (
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={leftIcon} size={20} color={colors.primary} />
      </View>
    ) : null);

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 64,
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
      }}
    >
      {left}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.textPrimary,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement}
      {shouldShowChevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          accessibilityRole="button"
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return content;
}
