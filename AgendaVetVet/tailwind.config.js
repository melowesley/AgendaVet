const theme = require("../packages/theme/index.ts").default;

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: theme.colors.light.primary,
          foreground: theme.colors.light["primary-foreground"],
        },
        background: theme.colors.light.background,
        foreground: theme.colors.light.foreground,
        card: {
          DEFAULT: theme.colors.light.card,
          foreground: theme.colors.light["card-foreground"],
        },
        border: theme.colors.light.border,
        destructive: {
          DEFAULT: theme.colors.light.destructive,
        },
        muted: {
          DEFAULT: theme.colors.light.muted,
          foreground: theme.colors.light["muted-foreground"],
        },
        accent: {
          DEFAULT: theme.colors.light.accent,
        },
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
