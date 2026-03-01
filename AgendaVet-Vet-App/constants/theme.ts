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
        statusConfirmed: '#3b82f6',
        statusCheckedIn: '#06b6d4',
        statusInProgress: '#8b5cf6',
        statusCompleted: '#10b981',
        statusCancelled: '#ef4444',
        statusNoShow: '#6b7280',
        // Sucesso/Erro
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
    },
    dark: {
        primary: '#4A9FD8',
        primaryDark: '#0369a1',
        primaryLight: '#082f49',
        background: '#000000',
        surface: '#09090b',
        border: '#18181b',
        text: '#fafafa',
        textSecondary: '#a1a1aa',
        textMuted: '#52525b',
        tint: '#4A9FD8',
        tabIconDefault: '#52525b',
        tabIconSelected: '#4A9FD8',
        statusPending: '#f59e0b',
        statusConfirmed: '#3b82f6',
        statusCheckedIn: '#06b6d4',
        statusInProgress: '#8b5cf6',
        statusCompleted: '#10b981',
        statusCancelled: '#ef4444',
        statusNoShow: '#6b7280',
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
});
