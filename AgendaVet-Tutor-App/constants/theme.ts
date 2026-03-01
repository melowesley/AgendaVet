/**
 * Paleta de cores AgendaVet — alinhada com o web app (azul #4A9FD8 / #0369a1)
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Identidade visual
    primary: '#4A9FD8',
    primaryDark: '#0369a1',
    primaryLight: '#bae6fd',
    // UI
    background: '#f0f9ff',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    // Abas
    tint: '#4A9FD8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#4A9FD8',
    // Status de agendamento
    statusPending: '#f59e0b',
    statusConfirmed: '#10b981',
    statusCancelled: '#ef4444',
    statusCompleted: '#6366f1',
    // Sucesso/Erro
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  dark: {
    // Identidade visual - Mantendo o azul AgendaVet ajustado para modo escuro
    primary: '#4A9FD8',
    primaryDark: '#0369a1',
    primaryLight: '#082f49', // Mais escuro para contraste no preto
    
    // UI - Estilo Supabase / Shadcn Dark
    background: '#000000',    // Preto verdadeiro
    surface: '#09090b',       // Cartão (Zinc 950)
    border: '#18181b',        // Borda discreta (Zinc 900)
    
    // Tipografia
    text: '#fafafa',          // Branco suave (Zinc 50)
    textSecondary: '#a1a1aa', // Texto secundário (Zinc 400)
    textMuted: '#52525b',      // Texto desativado (Zinc 600)
    
    // Elementos de Navegação
    tint: '#4A9FD8',
    tabIconDefault: '#52525b',
    tabIconSelected: '#4A9FD8',
    
    // Status (Cores mais vibrantes para destacar no fundo preto)
    statusPending: '#f59e0b',   // Amber
    statusConfirmed: '#10b981', // Emerald
    statusCancelled: '#ef4444', // Red
    statusCompleted: '#6366f1', // Indigo
    
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
