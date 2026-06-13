module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: parseInt(process.env.VERSION_CODE || String(config.android?.versionCode ?? 1), 10),
  },
  plugins: [
    "expo-location",
    "expo-image-picker",
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#ff6b2b",
        "defaultChannel": "izibul",
        "sounds": []
      }
    ]
  ],
});
