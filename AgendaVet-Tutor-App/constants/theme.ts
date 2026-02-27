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
    primary: '#4A9FD8',
    primaryDark: '#0369a1',
    primaryLight: '#075985',
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    tint: '#4A9FD8',
    tabIconDefault: '#64748b',
    tabIconSelected: '#4A9FD8',
    statusPending: '#fbbf24',
    statusConfirmed: '#34d399',
    statusCancelled: '#f87171',
    statusCompleted: '#818cf8',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
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
