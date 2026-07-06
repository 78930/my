/** @type {import('expo/config').ExpoConfig} */
const BACKEND_URL = 'http://192.168.1.8:5000';
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || BACKEND_URL).trim().replace(/\/$/, '');

module.exports = {
  expo: {
    name: 'Sketu',
    slug: 'sketu',
    scheme: 'sketu',
    owner: 'vikram379',
    version: '1.0.0',
    icon: './assets/images/icon.png',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['assets/**'],
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-secure-store',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash.png',
          backgroundColor: '#FFFFFF',
          backgroundColorDark: '#0B0F1A',
          resizeMode: 'contain',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            gradleProperties: {
              reactNativeArchitectures: 'arm64-v8a',
            },
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '840ef7d2-ade0-404b-9f1d-d417d955ee1d',
      },
      apiBaseUrl,
    },
    android: {
      package: 'com.vikram379.sketu',
    },
    ios: {
      bundleIdentifier: 'com.vikram379.sketu',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
  },
};
