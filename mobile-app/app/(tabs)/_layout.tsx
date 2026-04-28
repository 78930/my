import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs>
      <Tabs.Screen
        name="jobs"
        options={{ title: t('tabs.jobs') }}
      />
      <Tabs.Screen
        name="saved"
        options={{ title: t('tabs.saved') }}
      />
      <Tabs.Screen
        name="applications"
        options={{ title: t('tabs.applications') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile') }}
      />
    </Tabs>
  );
}