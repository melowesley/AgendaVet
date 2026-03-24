/**
 * Paleta de cores AgendaVet — Tema Emerald Premium
 * Alinhado com AgendaVetWeb e AgendaVetVet
 *
 * Light: fundo branco com acentos emerald-500 (#10b981)
 * Dark:  zinc profundo — elegante e consistente com o Web
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Identidade visual — Emerald (igual ao Web)
    primary: '#10b981',          // emerald-500
    primaryDark: '#059669',      // emerald-600
    primaryLight: '#d1fae5',     // emerald-100

    // Fundo e superfícies
    background: '#ffffff',
    surface: '#f9fafb',          // gray-50
    surfaceElevated: '#f3f4f6',  // gray-100
    border: '#e5e7eb',           // gray-200

    // Tipografia
    text: '#111827',             // gray-900
    textSecondary: '#4b5563',    // gray-600
    textMuted: '#9ca3af',        // gray-400

    // Abas
    tint: '#10b981',
    tabIconDefault: '#9ca3af',
    tabIconSelected: '#10b981',
    icon: '#9ca3af',

    // Status
    statusPending: '#f59e0b',
    statusConfirmed: '#3b82f6',
    statusCheckedIn: '#06b6d4',
    statusInProgress: '#8b5cf6',
    statusCompleted: '#10b981',
    statusCancelled: '#ef4444',
    statusNoShow: '#6b7280',

    // Feedback
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  dark: {
    // Identidade visual — Emerald (igual ao Web dark)
    primary: '#10b981',          // emerald-500
    primaryDark: '#059669',      // emerald-600
    primaryLight: '#064e3b',     // emerald-900

    // Zinc Palette (igual ao Web dark mode)
    background: '#09090b',       // zinc-950
    surface: '#18181b',          // zinc-900
    surfaceElevated: '#27272a',  // zinc-800
    border: '#27272a',           // zinc-800

    // Tipografia
    text: '#fafafa',             // zinc-50
    textSecondary: '#a1a1aa',    // zinc-400
    textMuted: '#52525b',        // zinc-600

    // Abas
    tint: '#10b981',
    tabIconDefault: '#52525b',
    tabIconSelected: '#10b981',
    icon: '#52525b',

    // Status
    statusPending: '#fbbf24',
    statusConfirmed: '#60a5fa',
    statusCheckedIn: '#22d3ee',
    statusInProgress: '#a78bfa',
    statusCompleted: '#10b981',
    statusCancelled: '#f87171',
    statusNoShow: '#71717a',

    // Feedback
    success: '#10b981',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
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
});
