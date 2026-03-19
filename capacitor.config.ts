import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.tapaway',
  appName: 'tapaway',
  webDir: 'dist',
  server: {
    url: 'https://06fba013-0ca2-42c8-b669-4adcf9e55711.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
