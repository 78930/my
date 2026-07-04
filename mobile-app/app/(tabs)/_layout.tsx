import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Routes that belong exclusively to one role
const WORKER_ROUTES = new Set(['index', 'jobs', 'resume', 'documents']);
const FACTORY_ROUTES = new Set(['factory', 'talent']);

function TabIcon({
  focused,
  icon,
  iconFocused,
  color,
}: {
  focused: boolean;
  icon: IoniconsName;
  iconFocused: IoniconsName;
  color: string;
}) {
  return <Ionicons name={focused ? iconFocused : icon} size={22} color={color} />;
}

// Per-tab item with spring scale + animated soft-pill behind the active icon
function TabItem({
  route,
  isFocused,
  options,
  navigation,
  scale,
}: {
  route: BottomTabBarProps['state']['routes'][number];
  isFocused: boolean;
  options: BottomTabBarProps['descriptors'][string]['options'];
  navigation: BottomTabBarProps['navigation'];
  scale: Animated.Value;
}) {
  const { colors } = useTheme();
  const bgOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(bgOpacity, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }, [isFocused]);

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.85,
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
      bounciness: 5,
    }).start();
  }

  function onPress() {
    Haptics.selectionAsync();
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name as never);
    }
  }

  const iconColor = isFocused ? colors.primary : colors.textTertiary;
  const label = typeof options.title === 'string' ? options.title : route.name;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 3 }}>
        {/* Icon with soft background pill when active */}
        <View style={{ width: 48, height: 30, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: 42,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.primarySoft,
              opacity: bgOpacity,
            }}
          />
          {options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: 22 })}
        </View>

        {/* Label */}
        <Text
          style={{
            fontSize: 10,
            fontFamily: isFocused ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
            color: iconColor,
            letterSpacing: 0.3,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { isFactory } = useAuth();
  const isWorker = !isFactory;
  const { colors } = useTheme();

  // One scale ref per registered route — stable across re-renders
  const scales = useRef(state.routes.map(() => new Animated.Value(1))).current;

  const visibleRoutes = state.routes.filter((route) => {
    if (WORKER_ROUTES.has(route.name)) return isWorker;
    if (FACTORY_ROUTES.has(route.name)) return isFactory;
    return true; // profile always visible
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceElevated,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
      }}
    >
      {visibleRoutes.map((route) => {
        const routeIndex = state.routes.indexOf(route);
        const { options } = descriptors[route.key];
        const isFocused = state.index === routeIndex;

        return (
          <TabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            options={options}
            navigation={navigation}
            scale={scales[routeIndex]}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { isFactory } = useAuth();
  const isWorker = !isFactory;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {/* Worker-only tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: isWorker ? undefined : null,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} icon="home-outline" iconFocused="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          href: isWorker ? undefined : null,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} icon="briefcase-outline" iconFocused="briefcase" />
          ),
        }}
      />
      <Tabs.Screen
        name="resume"
        options={{
          title: 'Resume',
          href: isWorker ? undefined : null,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} icon="document-attach-outline" iconFocused="document-attach" />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Docs',
          href: isWorker ? undefined : null,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} icon="shield-outline" iconFocused="shield-checkmark" />
          ),
        }}
      />

      {/* Factory-only tabs */}
      <Tabs.Screen
        name="factory"
        options={{
          title: 'Dashboard',
          href: isFactory ? undefined : null,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} icon="grid-outline" iconFocused="grid" />
          ),
        }}
      />
      <Tabs.Screen
        name="talent"
        options={{
          title: 'Talent',
          href: isFactory ? undefined : null,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} icon="people-outline" iconFocused="people" />
          ),
        }}
      />

      {/* Shared */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} icon="person-outline" iconFocused="person" />
          ),
        }}
      />
    </Tabs>
  );
}
