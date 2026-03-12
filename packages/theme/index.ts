/**
 * Design Tokens extraídos do AgendaVetWeb (globals.css)
 * Centralizando a identidade visual para Web e Mobile.
 */

export const theme = {
  colors: {
    // Light Mode (Default)
    light: {
      background: "#f9fafb",
      foreground: "#111827",
      card: "#ffffff",
      primary: "#0d9488",
      destructive: "#ef4444",
      border: "#e5e7eb",
      muted: "#f3f4f6",
      accent: "#f0fdfa",
    },
    // Dark Mode High-Fidelity (Mockup Matched: Charcoal-Emerald)
    dark: {
      background: "#040809", // Deepest Forest Black (No Blue)
      foreground: "#ecfdf5", // Emerald-50 (Very light green tint)
      card: "#0a1214",       // Darker charcoal with hint of emerald
      primary: "#10b981",    // Emerald-500
      destructive: "#f43f5e",
      border: "#132724",     // Dark emerald border
      muted: "#132724",
      accent: "#059669",
    }
  },
  radius: {
    lg: "1.5rem", // 2xl
    md: "1rem",   // xl
    sm: "0.5rem", // lg
  }
};

export default theme;
