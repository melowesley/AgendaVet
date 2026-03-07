/**
 * Paleta de cores AgendaVet — Tema Semi-Claro Premium
 *
 * Light: fundo branco-quente com acentos em teal/azul vibrante
 * Dark:  slate profundo (não preto puro) — elegante e suave
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Identidade visual — Sky Premium
    primary: '#0284C7',          // sky-600
    primaryDark: '#0369A1',      // sky-700
    primaryLight: '#E0F2FE',     // sky-100

    // Fundo e superfícies - Semi-Light balanced
    background: '#F8FAFC',       // slate-50
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',  // slate-100
    border: '#E2E8F0',           // slate-200

    // Tipografia
    text: '#0F172A',             // slate-900
    textSecondary: '#475569',    // slate-600
    textMuted: '#94A3B8',        // slate-400

    // Abas
    tint: '#0284C7',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#0284C7',

    // Status
    statusPending: '#F59E0B',
    statusConfirmed: '#3B82F6',
    statusCheckedIn: '#06B6D4',
    statusInProgress: '#8B5CF6',
    statusCompleted: '#10B981',
    statusCancelled: '#EF4444',
    statusNoShow: '#6B7280',

    // Feedback
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  dark: {
    // Identidade visual
    primary: '#38BDF8',          // sky-400
    primaryDark: '#0EA5E9',      // sky-500
    primaryLight: '#0C4A6E',     // sky-900

    // Fundo Navy Profundo (Premium) - Não preto puro
    background: '#0F172A',       // slate-900
    surface: '#1E293B',          // slate-800
    surfaceElevated: '#293548',  // slate-750 (custom)
    border: '#334155',           // slate-700

    // Tipografia
    text: '#F1F5F9',             // slate-100
    textSecondary: '#94A3B8',    // slate-400
    textMuted: '#475569',        // slate-600

    // Abas
    tint: '#38BDF8',
    tabIconDefault: '#475569',
    tabIconSelected: '#38BDF8',

    // Status
    statusPending: '#FBBF24',
    statusConfirmed: '#60A5FA',
    statusCheckedIn: '#22D3EE',
    statusInProgress: '#A78BFA',
    statusCompleted: '#34D399',
    statusCancelled: '#F87171',
    statusNoShow: '#94A3B8',

    // Feedback
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
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
