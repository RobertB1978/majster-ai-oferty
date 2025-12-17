import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6d17f3c07bf04294af962822a3d027a8',
  appName: 'Majster.AI',
  webDir: 'dist',
  // TIER 1.5: Production server configuration
  // For development: comment out server block and use local build
  // For production: uncomment and set to your production URL
  // server: {
  //   url: 'https://your-production-url.vercel.app',
  //   cleartext: true
  // },
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
