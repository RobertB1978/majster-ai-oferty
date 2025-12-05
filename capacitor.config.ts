import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6d17f3c07bf04294af962822a3d027a8',
  appName: 'Majster.AI',
  webDir: 'dist',
  server: {
    url: 'https://6d17f3c0-7bf0-4294-af96-2822a3d027a8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2563eb',
      showSpinner: false
    }
  }
};

export default config;
