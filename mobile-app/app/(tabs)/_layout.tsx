import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: boolean, icon: IoniconsName, iconFocused: IoniconsName) {
  return <Ionicons name={focused ? iconFocused : icon} size={22} color={focused ? colors.primary : colors.textMuted} />;
}

export default function TabLayout() {
  const { isFactory } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.borderDark,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      {isFactory ? (
        <>
          <Tabs.Screen
            name="factory"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ focused }) => tabIcon(focused, 'grid-outline', 'grid'),
            }}
          />
          <Tabs.Screen
            name="talent"
            options={{
              title: 'Talent',
              tabBarIcon: ({ focused }) => tabIcon(focused, 'people-outline', 'people'),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ focused }) => tabIcon(focused, 'business-outline', 'business'),
            }}
          />
          <Tabs.Screen name="jobs" options={{ href: null }} />
          <Tabs.Screen name="index" options={{ href: null }} />
        </>
      ) : (
        <>
          <Tabs.Screen
            name="jobs"
            options={{
              title: 'Jobs',
              tabBarIcon: ({ focused }) => tabIcon(focused, 'briefcase-outline', 'briefcase'),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ focused }) => tabIcon(focused, 'person-outline', 'person'),
            }}
          />
          <Tabs.Screen name="factory" options={{ href: null }} />
          <Tabs.Screen name="talent" options={{ href: null }} />
          <Tabs.Screen name="index" options={{ href: null }} />
        </>
      )}
    </Tabs>
  );
}
