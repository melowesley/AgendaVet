import { Linking, Platform } from 'react-native';
import { useState, useEffect } from 'react';

// URLs dos apps e web
const WEB_APP_URL = 'https://agendavet.com';
const TUTOR_APP_SCHEME = 'agendavettutorapp://';
const VET_APP_SCHEME = 'agendavetvetapp://';
const TUTOR_APP_STORE_URL = Platform.OS === 'ios'
  ? 'https://apps.apple.com/app/agendavet-tutor'
  : 'https://play.google.com/store/apps/details?id=com.wesley9827.AgendaVetTutorApp';
const VET_APP_STORE_URL = Platform.OS === 'ios'
  ? 'https://apps.apple.com/app/agendavet-vet'
  : 'https://play.google.com/store/apps/details?id=com.wesley9827.AgendaVetVetApp';

export class AppLinks {
  // Verificar se o app mobile está instalado
  static async isAppInstalled(appType: 'tutor' | 'vet'): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const scheme = appType === 'tutor' ? TUTOR_APP_SCHEME : VET_APP_SCHEME;

    try {
      return await Linking.canOpenURL(scheme);
    } catch {
      return false;
    }
  }

  // Abrir app específico ou redirecionar para loja
  static async openApp(appType: 'tutor' | 'vet', fallbackToWeb = true) {
    const scheme = appType === 'tutor' ? TUTOR_APP_SCHEME : VET_APP_SCHEME;
    const storeUrl = appType === 'tutor' ? TUTOR_APP_STORE_URL : VET_APP_STORE_URL;

    try {
      const canOpen = await Linking.canOpenURL(scheme);

      if (canOpen) {
        await Linking.openURL(scheme);
      } else {
        // App não instalado - abrir loja
        await Linking.openURL(storeUrl);
      }
    } catch (error) {
      console.error(`Erro ao abrir ${appType} app:`, error);

      if (fallbackToWeb) {
        // Fallback para web app
        const webUrl = `${WEB_APP_URL}/${appType}`;
        await Linking.openURL(webUrl);
      }
    }
  }

  // Abrir web app
  static async openWebApp(path?: string) {
    const url = path ? `${WEB_APP_URL}/${path}` : WEB_APP_URL;
    await Linking.openURL(url);
  }

  // Compartilhar link para app
  static async shareAppLink(appType: 'tutor' | 'vet') {
    const message = appType === 'tutor'
      ? 'Baixe o App AgendaVet Tutor: https://agendavet.com/app-tutor'
      : 'Baixe o App AgendaVet Vet: https://agendavet.com/app-vet';

    if (Platform.OS === 'ios') {
      await Linking.openURL(`sms:&body=${encodeURIComponent(message)}`);
    } else {
      await Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
    }
  }

  // Deep link para tela específica
  static async openAppWithPath(appType: 'tutor' | 'vet', path: string) {
    const scheme = appType === 'tutor' ? TUTOR_APP_SCHEME : VET_APP_SCHEME;
    const url = `${scheme}${path}`;

    try {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback: abrir app principal
        await this.openApp(appType);
      }
    } catch (error) {
      console.error(`Erro ao abrir ${appType} app com path:`, error);
      await this.openApp(appType);
    }
  }
}

// Hook para detectar se foi aberto via deep link
export const useDeepLink = () => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      setUrl(event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Verificar se foi aberto via deep link na inicialização
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        setUrl(initialUrl);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return url;
};
