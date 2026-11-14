import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.nordicaffairsmedia.tickets',
  appName: 'Nordic Affairs Media',
  webDir: 'dist',
  backgroundColor: '#061426',
  ios: { backgroundColor: '#061426' },
  plugins: {
    // Requests go through the phone's native network layer, so the website and booking API need no CORS rule for the app.
    CapacitorHttp: { enabled: true },
    SplashScreen: { backgroundColor: '#061426', launchAutoHide: true, launchShowDuration: 800 },
    StatusBar: { style: 'DARK', backgroundColor: '#061426' },
  },
}

export default config
