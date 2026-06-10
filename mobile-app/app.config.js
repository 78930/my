/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const BACKEND_URL = 'https://my-1-1iz4.onrender.com';
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || BACKEND_URL).trim().replace(/\/$/, '');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiBaseUrl,
    },
  },
};
