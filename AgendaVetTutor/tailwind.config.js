const theme = require("../packages/theme/index.ts").default;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: theme.colors.light.primary,
        background: theme.colors.light.background,
        card: theme.colors.light.card,
        border: theme.colors.light.border,
        foreground: theme.colors.light.foreground,
        destructive: theme.colors.light.destructive,
        muted: theme.colors.light.muted,
        accent: theme.colors.light.accent,
      },
      borderRadius: {
        lg: theme.radius.lg,
        md: theme.radius.md,
        sm: theme.radius.sm,
      }
    },
  },
  plugins: [],
};
