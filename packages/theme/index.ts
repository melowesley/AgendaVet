/**
 * Design Tokens extraídos do AgendaVetWeb (globals.css)
 * Centralizando a identidade visual para Web e Mobile.
 *
 * Alinhado com AgendaVetWeb globals.css:
 * - Light: branco com acentos emerald-500 (#10b981)
 * - Dark: zinc palette (zinc-950 background, zinc-900 card)
 */

export const theme = {
  colors: {
    // Light Mode — espelho do Web (globals.css :root)
    light: {
      background: "#f9fafb",   // gray-50 (próximo do oklch 0.985)
      foreground: "#111827",   // gray-900
      card: "#ffffff",         // branco puro
      primary: "#10b981",      // emerald-500
      destructive: "#ef4444",  // red-500
      border: "#e5e7eb",       // gray-200
      muted: "#f3f4f6",        // gray-100
      accent: "#d1fae5",       // emerald-100
      "muted-foreground": "#6b7280",   // gray-500
      "card-foreground": "#111827",
      "primary-foreground": "#ffffff",
    },
    // Dark Mode — espelho do Web (globals.css .dark) — Zinc Palette
    dark: {
      background: "#09090b",   // zinc-950
      foreground: "#fafafa",   // zinc-50
      card: "#18181b",         // zinc-900
      primary: "#10b981",      // emerald-500
      destructive: "#ef4444",  // red-500
      border: "#27272a",       // zinc-800
      muted: "#27272a",        // zinc-800
      accent: "#064e3b",       // emerald-900
      "muted-foreground": "#a1a1aa",   // zinc-400
      "card-foreground": "#fafafa",
      "primary-foreground": "#ffffff",
    }
  },
  radius: {
    lg: "1rem",    // igual ao --radius: 0.625rem do Web * escalado para mobile
    md: "0.75rem",
    sm: "0.5rem",
  }
};

export default theme;
