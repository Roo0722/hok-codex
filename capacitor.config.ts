import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jnjnbnd.hokcodex',
  appName: 'HoK Codex',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0D0D0D',
  },
};

export default config;
