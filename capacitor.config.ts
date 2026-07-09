import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the exact same web build (`dist/`) in a native iOS / Android
 * shell — one UI to maintain across web, desktop and mobile. Run
 * `npm run mobile:ios` / `npm run mobile:android` to sync and open the native
 * projects (requires Xcode / Android Studio).
 */
const config: CapacitorConfig = {
  appId: 'com.soundboard.app',
  appName: 'Soundboard',
  webDir: 'dist',
  backgroundColor: '#0b0b12',
  android: {
    // Allow low-latency audio and keep the app usable offline.
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    },
  },
};

export default config;
