module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: parseInt(process.env.VERSION_CODE || String(config.android?.versionCode ?? 1), 10),
  },
  plugins: [
    "expo-location",
    "expo-image-picker",
  ],
});
