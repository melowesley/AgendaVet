import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agendavet.app',
  appName: 'AgendaVet',
  webDir: 'dist',
  server: {
    // Em produção o app carrega os arquivos locais do webDir
  },
};

export default config;
