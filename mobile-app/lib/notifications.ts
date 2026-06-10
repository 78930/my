import { Platform } from 'react-native';

// Lazy import — expo-notifications crashes Expo Go on module load (SDK 53 removed
// remote push from Expo Go). We require() inside each function so the import only
// runs when the function is actually called, not at app startup.
function N() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-notifications') as typeof import('expo-notifications');
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Device = require('expo-device') as typeof import('expo-device');
    if (!Device.isDevice) return null;

    const Notifications = N();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sketu-jobs', {
        name: 'Job alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    // getExpoPushTokenAsync only works in standalone/dev-client builds, not Expo Go
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export async function scheduleLocalNotification(title: string, body: string, delaySeconds = 1) {
  try {
    const Notifications = N();
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: delaySeconds > 0
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds }
        : null,
    });
  } catch {
    // silently ignore — local notifications may not be available in all environments
  }
}

export async function clearAllNotifications() {
  try {
    const Notifications = N();
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // ignore
  }
}
