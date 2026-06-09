/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

// Local backend on your PC (same Wi-Fi as phone). Update IP if ipconfig shows a different address.
const LOCAL_API = 'http://192.168.1.4:5000';

const fromEnv = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '');
// Block old hosted API that still expects email/password
const apiBaseUrl =
  !fromEnv || fromEnv.includes('onrender.com') ? LOCAL_API : fromEnv;

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiBaseUrl,
    },
  },
};
