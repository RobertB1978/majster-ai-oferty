import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for Majster.AI
 *
 * PR-15 iOS Camera Permission note:
 * NSCameraUsageDescription MUST be set in ios/App/App/Info.plist before App Store submission.
 * Required text (Polish):
 *   "Majster.AI używa kamery do dodawania zdjęć do fotoprotokołu projektu oraz dokumentacji odbioru robót."
 * This specific description is required by Apple App Store review.
 * See docs/PHOTO_REPORT_NOTES.md for details.
 */
const config: CapacitorConfig = {
  appId: 'ai.majster.app',
  appName: 'Majster.AI',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#F59E0B',
      showSpinner: false
    }
  }
};

export default config;
