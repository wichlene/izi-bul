module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: parseInt(process.env.VERSION_CODE || String(config.android?.versionCode ?? 1), 10),
  },
  plugins: [
    ["react-native-maps", {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    }],
    "expo-location",
    "expo-image-picker",
  ],
});
