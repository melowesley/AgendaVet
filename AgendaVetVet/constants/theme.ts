/**
 * Paleta de cores AgendaVet — Tema Semi-Claro Premium
 *
 * Light: fundo branco-quente com acentos em teal/azul vibrante
 * Dark:  slate profundo (não preto puro) — elegante e suave
 */

import { Platform } from 'react-native';

export const Colors = {
    light: {
        primary: '#10b981',          // emerald-500
        primaryDark: '#059669',      // emerald-600
        primaryLight: '#d1fae5',     // emerald-100

        background: '#ffffff',
        surface: '#f9fafb',          // gray-50
        surfaceElevated: '#f3f4f6',  // gray-100
        border: '#e5e7eb',           // gray-200

        text: '#111827',             // gray-900
        textSecondary: '#4b5563',    // gray-600
        textMuted: '#9ca3af',        // gray-400

        tint: '#10b981',
        tabIconDefault: '#9ca3af',
        tabIconSelected: '#10b981',

        statusPending: '#f59e0b',
        statusConfirmed: '#3b82f6',
        statusInProgress: '#8b5cf6',
        statusCompleted: '#10b981',
        statusCancelled: '#ef4444',

        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
    },

    dark: {
        primary: '#10b981',          // emerald-500
        primaryDark: '#059669',      // emerald-600
        primaryLight: '#064e3b',     // emerald-900

        // Zinc Palette for dark mode
        background: '#09090b',       // zinc-950
        surface: '#18181b',          // zinc-900
        surfaceElevated: '#27272a',  // zinc-800
        border: '#27272a',           // zinc-800

        text: '#fafafa',             // zinc-50
        textSecondary: '#a1a1aa',    // zinc-400
        textMuted: '#52525b',        // zinc-600

        tint: '#10b981',
        tabIconDefault: '#52525b',
        tabIconSelected: '#10b981',

        statusPending: '#fbbf24',
        statusConfirmed: '#60a5fa',
        statusInProgress: '#a78bfa',
        statusCompleted: '#10b981',
        statusCancelled: '#f87171',

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
