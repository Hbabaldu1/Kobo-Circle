import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The Android shell is intentionally a thin, HTTPS-only wrapper around the live
 * production application. The web site itself continues to enter at `/`.
 */
const config: CapacitorConfig = {
  appId: 'app.kobocircle.android',
  appName: 'Kobo Circle',
  webDir: 'capacitor-web',
  server: {
    url: 'https://kobo-circle.vercel.app/login',
    androidScheme: 'https',
    // Keep the native WebView on Kobo Circle; external URLs are handled by Android.
    allowNavigation: ['kobo-circle.vercel.app'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#1B1F3B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
