import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ focused, icon, iconFocused }: { focused: boolean; icon: IoniconsName; iconFocused: IoniconsName }) {
  return <Ionicons name={focused ? iconFocused : icon} size={22} color={focused ? colors.primary : colors.textMuted} />;
}

export default function TabLayout() {
  const { isFactory } = useAuth();
  const isWorker = !isFactory;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.borderDark,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      {/* Worker-only tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: isWorker ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="home-outline" iconFocused="home" />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          href: isWorker ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="briefcase-outline" iconFocused="briefcase" />,
        }}
      />
      <Tabs.Screen
        name="resume"
        options={{
          title: 'Resume',
          href: isWorker ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="document-attach-outline" iconFocused="document-attach" />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          href: isWorker ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="shield-outline" iconFocused="shield-checkmark" />,
        }}
      />

      {/* Factory-only tabs */}
      <Tabs.Screen
        name="factory"
        options={{
          title: 'Dashboard',
          href: isFactory ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="grid-outline" iconFocused="grid" />,
        }}
      />
      <Tabs.Screen
        name="talent"
        options={{
          title: 'Talent',
          href: isFactory ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="people-outline" iconFocused="people" />,
        }}
      />

      {/* Shared */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="person-outline" iconFocused="person" />,
        }}
      />
    </Tabs>
  );
}
