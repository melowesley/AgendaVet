// Adicione estas funções ao seu AuthProvider existente
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Função para login com Google
export const signInWithGoogle = async () => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'agendavet-vet',
      path: 'auth/callback',
      preferMessenger: false,
    });

    const request = new AuthSession.AuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
      additionalParameters: {},
      prompt: AuthSession.Prompt.SelectAccount,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/oauth/v2/auth',
    });

    if (result.type === 'success') {
      // Aqui você pode usar o token do Google para autenticar no Supabase
      // ou fazer login direto no Supabase com o Google
      const { access_token } = result.params;

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: access_token,
      });

      if (error) throw error;
      return { data, error: null };
    }

    return { data: null, error: result };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { data: null, error };
  }
};

// Alternativa: Usar Supabase OAuth diretamente (mais simples)
export const signInWithGoogleSupabase = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: Platform.OS === 'web'
          ? window.location.origin
          : 'agendavet-vet://auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    return { data, error };
  } catch (error) {
    console.error('Supabase Google OAuth error:', error);
    return { data: null, error };
  }
};
